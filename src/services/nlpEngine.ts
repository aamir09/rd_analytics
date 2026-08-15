/**
 * nlpEngine.ts
 * Core NLP comparison logic, Multi-Agent architecture, robust fuzzy player matching,
 * 4-player support, and 10 differentiative stat selector.
 */

import type { SofaScorePlayer } from '../types';
import { STAT_REGISTRY, STAT_BY_KEY, type StatDef } from '../data/statRegistry';
import { executeGeminiToolCalling, executeMistralToolCalling, type NLPExecutionResult, type ToolTraceEntry } from './aiProviders';

export interface PercentileStat {
  key: string;
  label: string;
  category: 'ATT' | 'DEF' | 'PASS';
  higherIsBetter: boolean;
  values: {
    player: string;
    team: string;
    rawVal: number;
    percentile: number;
  }[];
}

export interface MultiPlayerComparisonData {
  players: SofaScorePlayer[];
  stats: PercentileStat[];
  departmentScores: {
    player: string;
    team: string;
    attScore: number;
    defScore: number;
    passScore: number;
  }[];
  top10DifferentiativeStats: string[];
}

// ── Text Normalization & Fuzzy String Matching Helpers ─────────────────────

export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function stringSimilarity(a: string, b: string): number {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(normA, normB);
  return 1.0 - dist / maxLen;
}

const STOP_WORDS = new Set([
  'compare', 'comparison', 'versus', 'vs', 'in', 'and', 'or', 'with', 'against',
  'stat', 'stats', 'statistics', 'attacking', 'attack', 'att', 'defensive', 'defense', 'def',
  'passing', 'pass', 'passes', 'playmaking', 'threat', 'creation', 'key', 'dribbles', 'dribble',
  'goals', 'goal', 'assists', 'assist', 'rating', 'finishing', 'between', 'who', 'is', 'are',
  'better', 'more', 'effective', 'than', 'for', 'the', 'a', 'an', 'show', 'chart', 'plot',
  'scatter', 'beeswarm', 'heatmap', 'pizza', 'profile', 'percentile', 'expected', 'xg', 'xa',
  'xgot', 'tackles', 'tackle', 'interceptions', 'clearances', 'minutes', 'played', 'duels',
  'aerial', 'ground', 'woodwork', 'cards', 'yellow', 'red', 'shots', 'shot', 'box', 'department',
  'aspects', 'characteristics', 'differentiative'
]);

/**
 * Normalize any AI-generated stat key to match our STAT_REGISTRY camelCase keys.
 * Handles: snake_case (tackles_won_per_90), label text ("Pass Accuracy"), camelCase, etc.
 */
export function normalizeStatKey(input: string | undefined | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim();

  // 1. Direct exact match
  if (STAT_BY_KEY[raw]) return raw;

  // 2. Build a normalized lookup string: lowercase, strip underscores/spaces/hyphens/per_90/percentage
  const norm = raw
    .toLowerCase()
    .replace(/_per_90/g, '')
    .replace(/_percentage/g, 'percentage')
    .replace(/_pct/g, 'percentage')
    .replace(/_percent/g, 'percentage')
    .replace(/[_\-\s]+/g, '');  // "tackles_won" → "tackleswon"

  // 3. Build same normalized form for every registry key and its label
  let bestKey: string | null = null;
  let bestScore = 0;

  for (const stat of STAT_REGISTRY) {
    const normKey = stat.key.toLowerCase();   // "tacklesWon" → "tackleswon"
    const normLabel = stat.label.toLowerCase().replace(/[^a-z0-9]/g, ''); // "Tackles Won" → "tackleswon"

    // Exact normalized match
    if (norm === normKey || norm === normLabel) return stat.key;

    // Substring containment (e.g., "successfuldribbles" contains "dribbles")
    if (normKey.includes(norm) || norm.includes(normKey)) {
      const score = Math.min(normKey.length, norm.length) / Math.max(normKey.length, norm.length);
      if (score > bestScore) {
        bestScore = score;
        bestKey = stat.key;
      }
    }
    if (normLabel.includes(norm) || norm.includes(normLabel)) {
      const score = Math.min(normLabel.length, norm.length) / Math.max(normLabel.length, norm.length);
      if (score > bestScore) {
        bestScore = score;
        bestKey = stat.key;
      }
    }

    // Levenshtein fuzzy match on normalized key
    const dist = levenshteinDistance(norm, normKey);
    const similarity = 1 - dist / Math.max(norm.length, normKey.length);
    if (similarity > bestScore && similarity > 0.65) {
      bestScore = similarity;
      bestKey = stat.key;
    }
  }

  return bestKey;
}

export function cleanQueryForPlayerNames(query: string): string {
  const words = normalizeText(query).split(' ');
  const filtered = words.filter(w => w.length > 0 && !STOP_WORDS.has(w));
  return filtered.join(' ');
}

export function findMatchingPlayer(queryName: string, players: SofaScorePlayer[]): SofaScorePlayer | null {
  if (!queryName || !players || !players.length) return null;
  const targetNorm = normalizeText(queryName);
  if (!targetNorm) return null;

  let bestPlayer = players.find(p => normalizeText(p.player_name) === targetNorm);
  if (bestPlayer) return bestPlayer;

  const targetTokens = targetNorm.split(' ');
  const primaryWord = targetTokens[targetTokens.length - 1];

  if (primaryWord.length >= 3) {
    const wordBoundaryRegex = new RegExp(`\\b${primaryWord}\\b`, 'i');
    bestPlayer = players.find(p => wordBoundaryRegex.test(normalizeText(p.player_name)));
    if (bestPlayer) return bestPlayer;
  }

  let highestScore = 0;
  let candidate: SofaScorePlayer | null = null;

  for (const p of players) {
    const pNorm = normalizeText(p.player_name);
    const pLastName = pNorm.split(' ').pop() || '';

    const scoreFull = stringSimilarity(targetNorm, pNorm);
    const scoreLast = primaryWord.length >= 4 ? stringSimilarity(primaryWord, pLastName) : 0;
    const maxScore = Math.max(scoreFull, scoreLast);

    if (maxScore > highestScore && maxScore >= 0.72) {
      highestScore = maxScore;
      candidate = p;
    }
  }

  return candidate;
}

/**
 * Extracts up to 4 player candidates from a prompt
 */
export function extractPlayerCandidatesFromQuery(userQuery: string, players: SofaScorePlayer[]): SofaScorePlayer[] {
  const eligiblePlayers = players.filter(p => p.statistics && (p.statistics.minutesPlayed ?? 0) > 0);
  const cleanedText = cleanQueryForPlayerNames(userQuery);
  const words = cleanedText.split(' ').filter(w => w.length > 1);

  if (words.length === 0) return [];

  const matchedList: SofaScorePlayer[] = [];

  const nGrams: string[] = [];
  for (let len = 3; len >= 1; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      nGrams.push(words.slice(i, i + len).join(' '));
    }
  }

  for (const nGram of nGrams) {
    const matched = findMatchingPlayer(nGram, eligiblePlayers);
    if (matched && !matchedList.some(m => m.player_id === matched.player_id)) {
      matchedList.push(matched);
      if (matchedList.length >= 4) break;
    }
  }

  return matchedList;
}

// ── Percentile Matrix & Top 10 Differentiative Stat Selector ────────────────

function calculatePercentile(val: number, allVals: number[], higherIsBetter: boolean): number {
  if (allVals.length === 0) return 50;
  const lowerCount = allVals.filter(v => higherIsBetter ? v < val : v > val).length;
  const equalCount = allVals.filter(v => v === val).length;
  const percentile = ((lowerCount + 0.5 * equalCount) / allVals.length) * 100;
  return Math.round(Math.min(99, Math.max(1, percentile)));
}

/**
 * Computes statistical variance across target players and picks top 10 differentiative characteristics
 */
export function selectTop10DifferentiativeStats(
  targetPlayers: SofaScorePlayer[],
  allPlayers: SofaScorePlayer[]
): string[] {
  if (!targetPlayers.length) return ['goals', 'expectedGoals', 'assists', 'keyPasses', 'tackles', 'interceptions', 'successfulDribbles', 'accuratePassesPercentage', 'clearances', 'touches'];

  const eligiblePlayers = allPlayers.filter(p => p.statistics && (p.statistics.minutesPlayed ?? 0) >= 180);

  const scoredStats = STAT_REGISTRY.map(statDef => {
    const percentiles = targetPlayers.map(p => {
      const rawVal = Number((p.statistics as any)?.[statDef.key] ?? 0);
      const allVals = eligiblePlayers.map(ep => Number((ep.statistics as any)?.[statDef.key] ?? 0));
      return calculatePercentile(rawVal, allVals, statDef.higherIsBetter);
    });

    // Calculate variance / range between maximum and minimum percentile
    if (!percentiles.length) {
      return { key: statDef.key, spread: 0, weightScore: 0, category: statDef.category };
    }

    const maxP = Math.max(...percentiles);
    const minP = Math.min(...percentiles);
    const spread = isFinite(maxP - minP) ? maxP - minP : 0;

    // Give slight boost to core metrics (goals, xG, keyPasses, tackles, etc.)
    const isCore = ['goals', 'expectedGoals', 'assists', 'keyPasses', 'tackles', 'interceptions', 'successfulDribbles', 'accuratePassesPercentage'].includes(statDef.key);
    const weightScore = spread + (isCore ? 15 : 0);

    return { key: statDef.key, spread, weightScore, category: statDef.category };
  });

  // Sort by highest differentiative spread
  scoredStats.sort((a, b) => (b.weightScore || 0) - (a.weightScore || 0));

  // Ensure balance across ATT, DEF, PASS categories if possible
  const selected: string[] = [];
  const categories = ['ATT', 'DEF', 'PASS'] as const;

  // Pick top 2 from each category first
  categories.forEach(cat => {
    const catStats = scoredStats.filter(s => s.category === cat);
    catStats.slice(0, 3).forEach(s => {
      if (!selected.includes(s.key)) selected.push(s.key);
    });
  });

  // Fill remaining slots up to 10-12 stats
  for (const s of scoredStats) {
    if (selected.length >= 10) break;
    if (!selected.includes(s.key)) selected.push(s.key);
  }

  return selected;
}

/**
 * Builds composite multi-player comparison across all ~80 SofaScore metrics for up to 4 players
 */
export function buildMultiPlayerComparison(
  targetPlayers: SofaScorePlayer[],
  allPlayers: SofaScorePlayer[]
): MultiPlayerComparisonData {
  const eligiblePlayers = allPlayers.filter(p => p.statistics && (p.statistics.minutesPlayed ?? 0) >= 180);

  const stats: PercentileStat[] = STAT_REGISTRY.map(statDef => {
    const allVals = eligiblePlayers.map(p => Number((p.statistics as any)?.[statDef.key] ?? 0));

    const values = targetPlayers.map(p => {
      const rawVal = Number((p.statistics as any)?.[statDef.key] ?? 0);
      const percentile = calculatePercentile(rawVal, allVals, statDef.higherIsBetter);
      return {
        player: p.player_name,
        team: p.team_name,
        rawVal,
        percentile
      };
    });

    return {
      key: statDef.key,
      label: statDef.label,
      category: statDef.category,
      higherIsBetter: statDef.higherIsBetter,
      values
    };
  });

  const departmentScores = targetPlayers.map(p => {
    const getAvgPercentile = (category: 'ATT' | 'DEF' | 'PASS') => {
      const filtered = stats.filter(s => s.category === category);
      if (!filtered.length) return 50;
      const sum = filtered.reduce((acc, s) => {
        const valObj = s.values.find(v => v.player === p.player_name);
        return acc + (valObj ? valObj.percentile : 50);
      }, 0);
      return Math.round(sum / filtered.length);
    };

    return {
      player: p.player_name,
      team: p.team_name,
      attScore: getAvgPercentile('ATT'),
      defScore: getAvgPercentile('DEF'),
      passScore: getAvgPercentile('PASS')
    };
  });

  const top10DifferentiativeStats = selectTop10DifferentiativeStats(targetPlayers, allPlayers);

  return {
    players: targetPlayers,
    stats,
    departmentScores,
    top10DifferentiativeStats
  };
}

// ── Multi-Agent Sub-Task Executors ──────────────────────────────────────────

/**
 * Agent 1: Entity Verification Agent
 */
export function verifyPlayerEntities(userQuery: string, allPlayers: SofaScorePlayer[]): SofaScorePlayer[] {
  const candidates = extractPlayerCandidatesFromQuery(userQuery, allPlayers);
  if (candidates.length > 0) return candidates.slice(0, 4);

  if (allPlayers.length === 0) return [];

  // Default fallback if generic query
  const bruno = findMatchingPlayer('Bruno Fernandes', allPlayers) || allPlayers[0];
  const odegaard = findMatchingPlayer('Martin Ødegaard', allPlayers) || allPlayers[1];
  return [bruno, odegaard].filter(Boolean);
}

/**
 * Agent 2: Attacking Specialist Agent — Comparative Analysis
 */
export function runAttackingAgent(compData: MultiPlayerComparisonData): string {
  const lines: string[] = ['### Attacking Specialist Analysis\n'];

  if (!compData.departmentScores || compData.departmentScores.length === 0) {
    return '### Attacking Specialist Analysis\nNo target players found for attacking breakdown.';
  }

  const ds = compData.departmentScores;
  const getStat = (key: string, player: string) => compData.stats.find(s => s.key === key)?.values.find(v => v.player === player);

  lines.push('| Player | Club | ATT Rating | Goals | xG | xG +/- | Shots on Target | Dribbles (Pctile) |');
  lines.push('| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |');

  ds.forEach(d => {
    const goals = getStat('goals', d.player)?.rawVal ?? 0;
    const xG = getStat('expectedGoals', d.player)?.rawVal ?? 0;
    const diff = (goals - xG).toFixed(2);
    const shots = getStat('shotsOnTarget', d.player)?.rawVal ?? 0;
    const drib = getStat('successfulDribbles', d.player)?.rawVal ?? 0;
    const dribPct = getStat('successfulDribbles', d.player)?.percentile ?? 50;
    lines.push(`| **${d.player}** | ${d.team} | **${d.attScore}/100** | ${goals} | ${xG.toFixed(2)} | ${Number(diff) >= 0 ? '+' : ''}${diff} | ${shots} | ${drib} (${dribPct}%) |`);
  });

  // Comparative narrative
  const sorted = [...ds].sort((a, b) => b.attScore - a.attScore);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const gap = best.attScore - worst.attScore;

  lines.push('\n#### Comparative Attacking Verdict');

  if (sorted.length >= 2) {
    const bestGoals = getStat('goals', best.player)?.rawVal ?? 0;
    const secondGoals = getStat('goals', sorted[1].player)?.rawVal ?? 0;
    const bestxG = getStat('expectedGoals', best.player)?.rawVal ?? 0;
    const worstxG = getStat('expectedGoals', worst.player)?.rawVal ?? 0;
    const bestDrib = getStat('successfulDribbles', best.player)?.percentile ?? 50;
    const worstDrib = getStat('successfulDribbles', worst.player)?.percentile ?? 50;

    lines.push(`- **${best.player}** leads the attacking department by a **${gap}-point margin** over ${worst.player} (${best.attScore} vs ${worst.attScore}/100). Scored **${bestGoals} goals** — ${bestGoals - secondGoals > 0 ? `${bestGoals - secondGoals} more than ${sorted[1].player}` : `level with ${sorted[1].player}`}.`);
    lines.push(`- **xG Finishing Efficiency**: ${best.player} generated ${bestxG.toFixed(2)} xG vs ${worst.player}'s ${worstxG.toFixed(2)} xG — a **${(bestxG - worstxG).toFixed(2)} xG gap** indicating ${bestxG > worstxG ? 'substantially higher shot quality and positioning' : 'different shot profiles'}.`);
    lines.push(`- **Dribble Penetration**: ${best.player} sits in the **${bestDrib}th percentile** for dribbles vs ${worst.player}'s **${worstDrib}th** — a ${Math.abs(bestDrib - worstDrib)} percentile-point separation in 1v1 ball carrying.`);
  }

  lines.push(`\n**Attacking Winner: ${best.player}** (${best.team}) — ATT Rating **${best.attScore}/100**`);
  return lines.join('\n');
}

/**
 * Agent 3: Defensive Specialist Agent — Comparative Analysis
 */
export function runDefensiveAgent(compData: MultiPlayerComparisonData): string {
  const lines: string[] = ['### Defensive Specialist Analysis\n'];

  if (!compData.departmentScores || compData.departmentScores.length === 0) {
    return '### Defensive Specialist Analysis\nNo target players found for defensive breakdown.';
  }

  const ds = compData.departmentScores;
  const getStat = (key: string, player: string) => compData.stats.find(s => s.key === key)?.values.find(v => v.player === player);

  lines.push('| Player | Club | DEF Rating | Tackles (Pctile) | Interceptions | Clearances | Ground Duels Won |');
  lines.push('| :--- | :--- | :---: | :---: | :---: | :---: | :---: |');

  ds.forEach(d => {
    const tck = getStat('tackles', d.player)?.rawVal ?? 0;
    const tckPct = getStat('tackles', d.player)?.percentile ?? 50;
    const intc = getStat('interceptions', d.player)?.rawVal ?? 0;
    const clr = getStat('clearances', d.player)?.rawVal ?? 0;
    const duels = getStat('groundDuelsWon', d.player)?.rawVal ?? 0;
    lines.push(`| **${d.player}** | ${d.team} | **${d.defScore}/100** | ${tck} (${tckPct}%) | ${intc} | ${clr} | ${duels} |`);
  });

  const sorted = [...ds].sort((a, b) => b.defScore - a.defScore);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const gap = best.defScore - worst.defScore;

  lines.push('\n#### Comparative Defensive Verdict');

  if (sorted.length >= 2) {
    const bestTck = getStat('tackles', best.player)?.rawVal ?? 0;
    const worstTck = getStat('tackles', worst.player)?.rawVal ?? 0;
    const bestDuels = getStat('groundDuelsWon', best.player)?.rawVal ?? 0;
    const worstDuels = getStat('groundDuelsWon', worst.player)?.rawVal ?? 0;
    const bestRec = getStat('ballRecovery', best.player)?.rawVal ?? 0;
    const worstRec = getStat('ballRecovery', worst.player)?.rawVal ?? 0;

    lines.push(`- **${best.player}** dominates defensively with a **${gap}-point advantage** (${best.defScore} vs ${worst.defScore}/100). Wins **${bestTck} tackles** compared to ${worst.player}'s ${worstTck} — ${bestTck > worstTck ? `${bestTck - worstTck} more tackles, reflecting higher defensive aggression` : 'comparable tackle output'}.`);
    lines.push(`- **Ground Duel Supremacy**: ${best.player} won **${bestDuels} duels** vs ${worst.player}'s **${worstDuels}** — ${bestDuels > worstDuels ? `a ${bestDuels - worstDuels}-duel advantage in contested situations` : 'neck and neck in physical contests'}.`);
    lines.push(`- **Ball Recovery**: ${best.player} recovers possession **${bestRec} times** vs ${worst.player}'s **${worstRec}** — ${bestRec > worstRec ? `${bestRec - worstRec} more recoveries, acting as a more effective disruptor` : 'similar recovery contributions'}.`);
  }

  lines.push(`\n**Defensive Winner: ${best.player}** (${best.team}) — DEF Rating **${best.defScore}/100**`);
  return lines.join('\n');
}

/**
 * Agent 4: Passing & Creativity Specialist Agent — Comparative Analysis
 */
export function runPassingAgent(compData: MultiPlayerComparisonData): string {
  const lines: string[] = ['### Passing & Playmaking Specialist Analysis\n'];

  if (!compData.departmentScores || compData.departmentScores.length === 0) {
    return '### Passing & Playmaking Specialist Analysis\nNo target players found for passing breakdown.';
  }

  const ds = compData.departmentScores;
  const getStat = (key: string, player: string) => compData.stats.find(s => s.key === key)?.values.find(v => v.player === player);

  lines.push('| Player | Club | PASS Rating | Key Passes | xA | Assists | Big Chances Created | Pass Acc. % |');
  lines.push('| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |');

  ds.forEach(d => {
    const key = getStat('keyPasses', d.player)?.rawVal ?? 0;
    const xA = getStat('expectedAssists', d.player)?.rawVal ?? 0;
    const ast = getStat('assists', d.player)?.rawVal ?? 0;
    const big = getStat('bigChancesCreated', d.player)?.rawVal ?? 0;
    const acc = getStat('accuratePassesPercentage', d.player)?.rawVal ?? 0;
    lines.push(`| **${d.player}** | ${d.team} | **${d.passScore}/100** | ${key} | ${xA.toFixed(2)} | ${ast} | ${big} | ${acc.toFixed(1)}% |`);
  });

  const sorted = [...ds].sort((a, b) => b.passScore - a.passScore);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const gap = best.passScore - worst.passScore;

  lines.push('\n#### Comparative Playmaking Verdict');

  if (sorted.length >= 2) {
    const bestKey = getStat('keyPasses', best.player)?.rawVal ?? 0;
    const worstKey = getStat('keyPasses', worst.player)?.rawVal ?? 0;
    const bestxA = getStat('expectedAssists', best.player)?.rawVal ?? 0;
    const worstxA = getStat('expectedAssists', worst.player)?.rawVal ?? 0;
    const bestBig = getStat('bigChancesCreated', best.player)?.rawVal ?? 0;
    const worstBig = getStat('bigChancesCreated', worst.player)?.rawVal ?? 0;

    lines.push(`- **${best.player}** leads creative output by a **${gap}-point margin** (${best.passScore} vs ${worst.passScore}/100). Delivered **${bestKey} key passes** vs ${worst.player}'s ${worstKey} — ${bestKey > worstKey ? `${bestKey - worstKey} more chance-creating deliveries` : 'comparable chance creation'}.`);
    lines.push(`- **Expected Assists (xA)**: ${best.player} accumulated **${bestxA.toFixed(2)} xA** vs ${worst.player}'s **${worstxA.toFixed(2)}** — a **${(bestxA - worstxA).toFixed(2)} xA gap** ${bestxA > worstxA ? 'reflecting higher-quality final balls' : 'showing similar creative quality'}.`);
    lines.push(`- **Big Chances Created**: ${best.player} engineered **${bestBig}** clear-cut opportunities vs ${worst.player}'s **${worstBig}** — ${bestBig > worstBig ? `${bestBig - worstBig} more high-value scoring chances` : 'matching creative output in big moments'}.`);
  }

  lines.push(`\n**Creative Winner: ${best.player}** (${best.team}) — PASS Rating **${best.passScore}/100**`);
  return lines.join('\n');
}

/**
 * Agent 5: Master Synthesizer Agent — Comparative Executive Report
 */
export function runMasterSynthesizerAgent(
  userQuery: string,
  compData: MultiPlayerComparisonData,
  attReport: string,
  defReport: string,
  passReport: string
): string {
  const playerNames = compData.players.map(p => `${p.player_name} (${p.team_name})`).join(', ');
  const top10Labels = compData.top10DifferentiativeStats.map(k => STAT_BY_KEY[k]?.label || k).join(', ');

  // Build comparative rankings
  const ds = compData.departmentScores;
  const sortedAtt = [...ds].sort((a, b) => b.attScore - a.attScore);
  const sortedDef = [...ds].sort((a, b) => b.defScore - a.defScore);
  const sortedPass = [...ds].sort((a, b) => b.passScore - a.passScore);

  // Compute overall weighted score
  const overallRanked = [...ds].map(d => ({
    ...d,
    overall: Math.round(d.attScore * 0.35 + d.defScore * 0.30 + d.passScore * 0.35)
  })).sort((a, b) => b.overall - a.overall);

  const best = overallRanked[0];
  const second = overallRanked.length > 1 ? overallRanked[1] : null;

  // Build power ranking table
  let verdictLines = `### Executive Tactical Verdict & Synthesis\n\n`;
  verdictLines += `| Rank | Player | ATT | DEF | PASS | Overall |\n`;
  verdictLines += `| :---: | :--- | :---: | :---: | :---: | :---: |\n`;
  overallRanked.forEach((d, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
    verdictLines += `| ${medal} | **${d.player}** (${d.team}) | ${d.attScore} | ${d.defScore} | ${d.passScore} | **${d.overall}** |\n`;
  });

  // Build comparative verdict bullets
  verdictLines += `\n#### Final Verdict`;
  verdictLines += `\n- **${best.player}** emerges as the most complete player with an overall rating of **${best.overall}/100**, ${second ? `edging out ${second.player} (${second.overall}/100) by ${best.overall - second.overall} points` : 'leading across departments'}.`;
  verdictLines += `\n- **Best Attacker**: ${sortedAtt[0].player} (${sortedAtt[0].attScore}/100)${sortedAtt.length > 1 ? ` — ${sortedAtt[0].attScore - sortedAtt[sortedAtt.length - 1].attScore}-point gap over ${sortedAtt[sortedAtt.length - 1].player}` : ''}.`;
  verdictLines += `\n- **Best Defender**: ${sortedDef[0].player} (${sortedDef[0].defScore}/100)${sortedDef.length > 1 ? ` — ${sortedDef[0].defScore - sortedDef[sortedDef.length - 1].defScore}-point gap over ${sortedDef[sortedDef.length - 1].player}` : ''}.`;
  verdictLines += `\n- **Best Creator**: ${sortedPass[0].player} (${sortedPass[0].passScore}/100)${sortedPass.length > 1 ? ` — ${sortedPass[0].passScore - sortedPass[sortedPass.length - 1].passScore}-point gap over ${sortedPass[sortedPass.length - 1].player}` : ''}.`;

  return `# Master Tactical Comparison Report: ${playerNames}

${attReport}

${defReport}

${passReport}

${verdictLines}

**Interactive Visualization Configured:**
The dynamic chart visualization has auto-selected the top 10 metrics with highest statistical variance across the target players: **${top10Labels}**. Click **Sync Interactive Chart** to view percentile profiles on Pizza, Beeswarm, Scatter, or Z-Score Heatmap charts.`;
}

// ── Tool Executor & Local Fallback Engine ───────────────────────────────────

export function createDatasetToolExecutor(allPlayers: SofaScorePlayer[]) {
  return async (name: string, args: Record<string, any>): Promise<any> => {
    switch (name) {
      case 'search_players': {
        const rawQ = String(args.query || '');
        const cleanQ = cleanQueryForPlayerNames(rawQ);
        const q = cleanQ || rawQ;

        const directMatch = findMatchingPlayer(q, allPlayers);
        if (directMatch) {
          return {
            count: 1,
            players: [{
              id: directMatch.player_id,
              name: directMatch.player_name,
              team: directMatch.team_name,
              position: directMatch.position,
              goals: directMatch.statistics?.goals ?? 0,
              assists: directMatch.statistics?.assists ?? 0,
              rating: directMatch.statistics?.rating ?? null
            }]
          };
        }

        const normQ = normalizeText(q);
        const results = allPlayers
          .filter(p => normalizeText(p.player_name).includes(normQ) || normalizeText(p.team_name).includes(normQ))
          .slice(0, 5)
          .map(p => ({
            id: p.player_id,
            name: p.player_name,
            team: p.team_name,
            position: p.position,
            goals: p.statistics?.goals ?? 0,
            assists: p.statistics?.assists ?? 0,
            rating: p.statistics?.rating ?? null
          }));

        return { count: results.length, players: results };
      }

      case 'get_player_metrics': {
        const p = findMatchingPlayer(args.playerName, allPlayers);
        if (!p) return { error: `Player '${args.playerName}' not found in Premier League dataset.` };
        const comp = buildMultiPlayerComparison([p], allPlayers);
        const pScore = comp.departmentScores[0];
        return {
          player: p.player_name,
          team: p.team_name,
          position: p.position,
          rating: p.statistics?.rating,
          scores: {
            attending: pScore?.attScore ?? 50,
            defensive: pScore?.defScore ?? 50,
            passing: pScore?.passScore ?? 50
          },
          topMetrics: comp.stats.slice(0, 10).map(s => ({
            stat: s.label,
            val: s.values[0]?.rawVal ?? 0,
            percentile: s.values[0]?.percentile ?? 50
          }))
        };
      }

      case 'compare_players': {
        const nameList = [args.playerA, args.playerB, args.playerC, args.playerD].filter(Boolean);
        const matchedPlayers: SofaScorePlayer[] = [];

        for (const name of nameList) {
          const matched = findMatchingPlayer(name, allPlayers);
          if (matched && !matchedPlayers.some(mp => mp.player_id === matched.player_id)) {
            matchedPlayers.push(matched);
          }
        }

        if (matchedPlayers.length === 0) {
          return { error: `Could not match requested players in the Premier League dataset.` };
        }

        const comp = buildMultiPlayerComparison(matchedPlayers, allPlayers);

        return {
          comparedPlayers: comp.departmentScores,
          top10DifferentiativeStats: comp.top10DifferentiativeStats.map(k => STAT_BY_KEY[k]?.label || k)
        };
      }

      case 'set_active_chart': {
        const nameList = [args.playerA, args.playerB, args.playerC, args.playerD].filter(Boolean);
        const matched = nameList.map(n => findMatchingPlayer(n, allPlayers)).filter(Boolean) as SofaScorePlayer[];

        const top10 = matched.length > 0
          ? selectTop10DifferentiativeStats(matched, allPlayers)
          : ['goals', 'expectedGoals', 'assists', 'keyPasses', 'tackles', 'interceptions', 'successfulDribbles', 'accuratePassesPercentage', 'clearances', 'touches'];

        // Normalize AI-returned stat keys to our actual camelCase registry keys
        let resolvedStats = top10;
        if (args.selectedStats && Array.isArray(args.selectedStats) && args.selectedStats.length >= 5) {
          const mapped = args.selectedStats
            .map((k: string) => normalizeStatKey(k))
            .filter((k: string | null): k is string => k !== null);
          // Deduplicate
          const unique = [...new Set(mapped)];
          // Only use AI keys if we successfully resolved at least 5 of them
          if (unique.length >= 5) {
            resolvedStats = unique;
            // Force at least 10 stats by appending from the engine's top10
            if (resolvedStats.length < 10) {
              const remaining = top10.filter(k => !resolvedStats.includes(k));
              resolvedStats = [...resolvedStats, ...remaining].slice(0, 10);
            } else if (resolvedStats.length > 12) {
              resolvedStats = resolvedStats.slice(0, 12);
            }
          }
        }

        return {
          status: 'configured',
          vizType: args.vizType,
          playerA: matched[0]?.player_name || args.playerA,
          playerB: matched[1]?.player_name || args.playerB || null,
          playerC: matched[2]?.player_name || args.playerC || null,
          playerD: matched[3]?.player_name || args.playerD || null,
          xMetric: normalizeStatKey(args.xMetric) || 'expectedGoals',
          yMetric: normalizeStatKey(args.yMetric) || 'goals',
          selectedStats: resolvedStats
        };
      }

      default:
        return { error: `Unknown tool '${name}'` };
    }
  };
}

/**
 * Local Fallback Multi-Agent Engine
 */
export function runLocalFallbackQuery(userQuery: string, allPlayers: SofaScorePlayer[]): NLPExecutionResult {
  const toolTrace: ToolTraceEntry[] = [];
  
  // Step 1: Verification Agent
  const verifiedPlayers = verifyPlayerEntities(userQuery, allPlayers);

  toolTrace.push({
    step: 1,
    toolName: 'verify_player_entities',
    args: { query: userQuery },
    resultSummary: `Verified ${verifiedPlayers.length} players: ${verifiedPlayers.map(p => `${p.player_name} (${p.team_name})`).join(', ')}`,
    timestamp: new Date().toLocaleTimeString()
  });

  // Step 2: Build Multi-Player Percentile Matrix & Top 10 Differentiative Characteristics
  const compData = buildMultiPlayerComparison(verifiedPlayers, allPlayers);

  toolTrace.push({
    step: 2,
    toolName: 'compare_players',
    args: {
      playerA: verifiedPlayers[0]?.player_name,
      playerB: verifiedPlayers[1]?.player_name,
      playerC: verifiedPlayers[2]?.player_name,
      playerD: verifiedPlayers[3]?.player_name
    },
    resultSummary: `Computed department scores for ${verifiedPlayers.length} players across 80+ SofaScore metrics`,
    timestamp: new Date().toLocaleTimeString()
  });

  // Step 3: Run Department Specialist Agents
  const attReport = runAttackingAgent(compData);
  const defReport = runDefensiveAgent(compData);
  const passReport = runPassingAgent(compData);

  toolTrace.push({
    step: 3,
    toolName: 'run_department_agents',
    args: { departments: ['Attacking', 'Defensive', 'Passing'] },
    resultSummary: `Attacking, Defensive, and Passing agents generated departmental analysis`,
    timestamp: new Date().toLocaleTimeString()
  });

  // Step 4: Run Master Synthesizer Agent
  const masterReport = runMasterSynthesizerAgent(userQuery, compData, attReport, defReport, passReport);

  toolTrace.push({
    step: 4,
    toolName: 'run_master_synthesizer',
    args: { prompt: userQuery },
    resultSummary: `Master Synthesizer compiled full tactical comparison report`,
    timestamp: new Date().toLocaleTimeString()
  });

  // Step 5: Configure Visualization Chart with Top 10 Differentiative Characteristics
  const qLower = normalizeText(userQuery);
  let vizType: 'pizza' = 'pizza';

  toolTrace.push({
    step: 5,
    toolName: 'set_active_chart',
    args: { vizType, selectedStats: compData.top10DifferentiativeStats },
    resultSummary: `Selected ${compData.top10DifferentiativeStats.length} top differentiative characteristics for ${vizType.toUpperCase()} chart`,
    timestamp: new Date().toLocaleTimeString()
  });

  return {
    providerUsed: 'local_fallback',
    rawResponseText: masterReport,
    toolTrace,
    chartConfig: {
      vizType,
      playerA: verifiedPlayers[0]?.player_name,
      playerB: verifiedPlayers[1]?.player_name,
      playerC: verifiedPlayers[2]?.player_name,
      playerD: verifiedPlayers[3]?.player_name,
      xMetric: 'expectedGoals',
      yMetric: 'goals',
      selectedStats: compData.top10DifferentiativeStats
    },
    comparisonData: compData,
    departmentReports: {
      attacking: attReport,
      defensive: defReport,
      passing: passReport,
      verification: `Verified Players: ${verifiedPlayers.map(p => `${p.player_name} (${p.team_name})`).join(', ')}`
    }
  };
}

export async function processNLPPlayerQuery(
  userQuery: string,
  allPlayers: SofaScorePlayer[],
  preferredProvider: 'auto' | 'gemini' | 'mistral' = 'auto'
): Promise<NLPExecutionResult> {
  const toolExecutor = createDatasetToolExecutor(allPlayers);

  if (preferredProvider === 'gemini' || preferredProvider === 'auto') {
    try {
      return await executeGeminiToolCalling(userQuery, toolExecutor);
    } catch (err: any) {
      console.warn('Gemini 2.5 API call failed, attempting fallback...', err?.message);
      if (preferredProvider === 'gemini') {
        return runLocalFallbackQuery(userQuery, allPlayers);
      }
    }
  }

  if (preferredProvider === 'mistral' || preferredProvider === 'auto') {
    try {
      return await executeMistralToolCalling(userQuery, toolExecutor);
    } catch (err: any) {
      console.warn('Mistral Large API call failed, attempting fallback...', err?.message);
    }
  }

  return runLocalFallbackQuery(userQuery, allPlayers);
}
