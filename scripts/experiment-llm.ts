import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dummy imports simulating the NLP Engine features (we'll implement the matching here to be self-contained for the experiment)
interface SofaScorePlayer {
  player_id: number;
  player_name: string;
  team_name: string;
  position: string;
  statistics?: Record<string, any>;
}

// 1. Two-Stage Name Matching (Fuzzy/Phonetic + Positional/Contextual)
function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
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

function stringSimilarity(a: string, b: string): number {
  const normA = normalizeText(a);
  const normB = normalizeText(b);
  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;
  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1.0;
  return 1.0 - levenshteinDistance(normA, normB) / maxLen;
}

// Architecture: Contextual Resolution
function resolvePlayer(queryName: string, players: SofaScorePlayer[], targetTeam?: string): SofaScorePlayer | null {
  const targetNorm = normalizeText(queryName);
  let highestScore = 0;
  let candidate: SofaScorePlayer | null = null;
  
  for (const p of players) {
    const pNorm = normalizeText(p.player_name);
    const scoreFull = stringSimilarity(targetNorm, pNorm);
    const pLastName = pNorm.split(' ').pop() || '';
    const queryLast = targetNorm.split(' ').pop() || '';
    const scoreLast = stringSimilarity(queryLast, pLastName);
    
    let maxScore = Math.max(scoreFull, scoreLast);
    
    // Positional/Team Contextual Boost (Stage 2 of Architecture)
    if (targetTeam && normalizeText(p.team_name).includes(normalizeText(targetTeam))) {
      maxScore += 0.25; // 25% boost for context match
    }

    if (maxScore > highestScore && maxScore >= 0.70) {
      highestScore = maxScore;
      candidate = p;
    }
  }
  
  return candidate;
}

// Agent Runner using Gemini
async function runAgent(systemPrompt: string, userQuery: string, dataContext: any): Promise<string> {
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const client = new GoogleGenAI({ apiKey });

  const contents = `
System Instructions:
${systemPrompt}

Data Context:
${JSON.stringify(dataContext, null, 2)}

User Query:
${userQuery}
`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
    });
    return response.text || '';
  } catch (err: any) {
    console.error('Agent generation failed', err);
    return 'Agent generation failed.';
  }
}

async function main() {
  console.log('--- Loading Dataset ---');
  const dataPath = path.join(__dirname, '../public/data/sofascore/2526_player_stats.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  let players: SofaScorePlayer[] = JSON.parse(rawData);

  // --- EXPERIMENT TEST CASE 1: Single Agent (Attacking) ---
  console.log('\n=== Executing Test Case 1: Mbeumo vs Rayan ===');
  
  // Custom patching as per requirement: 
  // "Bryan Mbeumo is a Manchester United Player, Rayan is a Bournmouth Player"
  const mbeumo = resolvePlayer('Bryan Mbeumo', players);
  if (mbeumo) mbeumo.team_name = 'Manchester United';
  
  // "Rayan" at Bournemouth -> resolving to a Brazilian player or just Rayan
  // We'll search specifically for "Rayan" and give a contextual boost to "Bournemouth"
  const rayan = resolvePlayer('Rayan', players, 'Bournemouth') || resolvePlayer('Ryan Christie', players);
  if (rayan) rayan.team_name = 'Bournemouth';
  
  if (!mbeumo || !rayan) {
    console.error('Failed to resolve Mbeumo or Rayan.');
  }

  const tc1Context = {
    players: [mbeumo, rayan].filter(Boolean)
  };

  const tc1Prompt = `
You are the Attacking Specialist Agent.
Analyze the two provided players strictly on their attacking attributes (Goals, xG, Shots, Dribbles, etc.).
Provide a comparative narrative summarizing who is the better attacker. 
Format your output as markdown with clear headings.
`;

  const tc1Report = await runAgent(tc1Prompt, 'Compare Bryan Mbeumo and Rayan on attack', tc1Context);
  
  const tc1Result = {
    testCase: 1,
    query: 'Compare Bryan Mbeumo and Rayan on attack',
    matchedPlayers: [mbeumo?.player_name, rayan?.player_name],
    report: tc1Report,
    chartConfig: {
      vizType: 'pizza',
      playerA: mbeumo?.player_name,
      playerB: rayan?.player_name,
      selectedStats: ['goals', 'expectedGoals', 'shots', 'shotsOnTarget', 'successfulDribbles', 'bigChancesCreated']
    }
  };

  // --- EXPERIMENT TEST CASE 2: Multi-Agent Swarm (Attack, Defense, Passing + Summarizer) ---
  console.log('\n=== Executing Test Case 2: Bruno vs Palmer vs Odegaard ===');
  const bruno = resolvePlayer('Bruno Fernandes', players, 'Manchester United');
  const palmer = resolvePlayer('Cole Palmer', players, 'Chelsea');
  const odegaard = resolvePlayer('Martin Odegaard', players, 'Arsenal');

  const tc2Context = {
    players: [bruno, palmer, odegaard].filter(Boolean)
  };

  console.log('Running 3 Sub-Agents in parallel...');
  const [attackReport, defenseReport, passingReport] = await Promise.all([
    runAgent(
      'You are the Attacking Specialist Agent. Analyze Goals, xG, Shots, and Dribbles. Determine the best attacker.',
      'Compare Bruno Fernandes, Cole Palmer and Martin Odegaard on attack.',
      tc2Context
    ),
    runAgent(
      'You are the Defensive Specialist Agent. Analyze Tackles, Interceptions, Clearances, and Duels. Determine the best defensive contributor.',
      'Compare Bruno Fernandes, Cole Palmer and Martin Odegaard on defense.',
      tc2Context
    ),
    runAgent(
      'You are the Passing Specialist Agent. Analyze Key Passes, Pass Accuracy, xA, and Crosses. Determine the best playmaker.',
      'Compare Bruno Fernandes, Cole Palmer and Martin Odegaard on passing.',
      tc2Context
    )
  ]);

  console.log('Running Master Synthesizer Agent...');
  const synthesizerPrompt = `
You are the Master Synthesizer Agent.
You will be provided with reports from 3 sub-agents (Attacking, Defensive, Passing).
Your job is to synthesize these reports into a final cohesive executive dashboard summary.
Format your output in clean Markdown with an "Executive Summary", followed by brief highlights for each category.
Do NOT just paste their text; synthesize and draw a final verdict.
`;
  
  const synthesizerInput = `
Sub-Agent Reports:
[ATTACKING REPORT]
${attackReport}

[DEFENSIVE REPORT]
${defenseReport}

[PASSING REPORT]
${passingReport}
`;

  const tc2Report = await runAgent(synthesizerPrompt, 'Synthesize the reports for Bruno, Palmer, and Odegaard.', synthesizerInput);

  const tc2Result = {
    testCase: 2,
    query: 'Compare Burno Fernandes, Cole Palmer and Martin Odegaard.',
    matchedPlayers: [bruno?.player_name, palmer?.player_name, odegaard?.player_name],
    subAgentReports: {
      attack: attackReport,
      defense: defenseReport,
      passing: passingReport
    },
    masterReport: tc2Report,
    chartConfig: {
      vizType: 'beeswarm', // The dashboard will render multiple charts anyway
      playerA: bruno?.player_name,
      playerB: palmer?.player_name,
      playerC: odegaard?.player_name,
      selectedStats: ['goals', 'expectedGoals', 'keyPasses', 'expectedAssists', 'tackles', 'interceptions', 'accuratePassesPercentage']
    }
  };

  // --- SAVE RESULTS ---
  console.log('\n--- Saving Results ---');
  const resultsData = {
    testCase1: tc1Result,
    testCase2: tc2Result,
    generatedAt: new Date().toISOString()
  };

  const outputPath = path.join(__dirname, '../public/data/experiment_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(resultsData, null, 2));
  console.log(`Results saved to ${outputPath}`);
}

main().catch(console.error);
