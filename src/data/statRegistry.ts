/**
 * statRegistry.ts
 * Central config for SofaScore stat categories — ATT, DEF, PASS.
 * Used by all Compare page visualization components.
 */

export type StatCategory = 'ATT' | 'DEF' | 'PASS';

export interface StatDef {
  key: string;
  label: string;
  category: StatCategory;
  higherIsBetter: boolean;
}

export const STAT_REGISTRY: StatDef[] = [
  // ── ATT (Attacking) ────────────────────────────────────────
  { key: 'goals',                       label: 'Goals',               category: 'ATT', higherIsBetter: true  },
  { key: 'expectedGoals',               label: 'Expected Goals (xG)', category: 'ATT', higherIsBetter: true  },
  { key: 'goalConversionPercentage',    label: 'Goal Conversion %',   category: 'ATT', higherIsBetter: true  },
  { key: 'totalShots',                  label: 'Total Shots',         category: 'ATT', higherIsBetter: true  },
  { key: 'shotsOnTarget',               label: 'Shots on Target',     category: 'ATT', higherIsBetter: true  },
  { key: 'shotsOffTarget',              label: 'Shots Off Target',    category: 'ATT', higherIsBetter: false },
  { key: 'shotsFromInsideTheBox',       label: 'Shots Inside Box',    category: 'ATT', higherIsBetter: true  },
  { key: 'goalsFromInsideTheBox',       label: 'Goals Inside Box',    category: 'ATT', higherIsBetter: true  },
  { key: 'goalsFromOutsideTheBox',      label: 'Goals Outside Box',   category: 'ATT', higherIsBetter: true  },
  { key: 'bigChancesMissed',            label: 'Big Chances Missed',  category: 'ATT', higherIsBetter: false },
  { key: 'headedGoals',                 label: 'Headed Goals',        category: 'ATT', higherIsBetter: true  },
  { key: 'hitWoodwork',                 label: 'Hit Woodwork',        category: 'ATT', higherIsBetter: false },
  { key: 'offsides',                    label: 'Offsides',            category: 'ATT', higherIsBetter: false },
  { key: 'penaltyGoals',               label: 'Penalty Goals',       category: 'ATT', higherIsBetter: true  },
  { key: 'freeKickGoal',               label: 'Free Kick Goals',     category: 'ATT', higherIsBetter: true  },
  { key: 'successfulDribbles',          label: 'Successful Dribbles', category: 'ATT', higherIsBetter: true  },
  { key: 'successfulDribblesPercentage',label: 'Dribble Success %',   category: 'ATT', higherIsBetter: true  },
  { key: 'dispossessed',                label: 'Dispossessed',        category: 'ATT', higherIsBetter: false },
  { key: 'touches',                     label: 'Touches',             category: 'ATT', higherIsBetter: true  },

  // ── DEF (Defensive) ────────────────────────────────────────
  { key: 'tackles',                     label: 'Tackles',             category: 'DEF', higherIsBetter: true  },
  { key: 'tacklesWon',                  label: 'Tackles Won',         category: 'DEF', higherIsBetter: true  },
  { key: 'tacklesWonPercentage',        label: 'Tackles Won %',       category: 'DEF', higherIsBetter: true  },
  { key: 'interceptions',               label: 'Interceptions',       category: 'DEF', higherIsBetter: true  },
  { key: 'clearances',                  label: 'Clearances',          category: 'DEF', higherIsBetter: true  },
  { key: 'blockedShots',                label: 'Blocked Shots',       category: 'DEF', higherIsBetter: true  },
  { key: 'outfielderBlocks',            label: 'Outfielder Blocks',   category: 'DEF', higherIsBetter: true  },
  { key: 'dribbledPast',                label: 'Dribbled Past',       category: 'DEF', higherIsBetter: false },
  { key: 'groundDuelsWon',              label: 'Ground Duels Won',    category: 'DEF', higherIsBetter: true  },
  { key: 'groundDuelsWonPercentage',    label: 'Ground Duels Won %',  category: 'DEF', higherIsBetter: true  },
  { key: 'aerialDuelsWon',              label: 'Aerial Duels Won',    category: 'DEF', higherIsBetter: true  },
  { key: 'aerialDuelsWonPercentage',    label: 'Aerial Duels Won %',  category: 'DEF', higherIsBetter: true  },
  { key: 'totalDuelsWon',               label: 'Total Duels Won',     category: 'DEF', higherIsBetter: true  },
  { key: 'ballRecovery',                label: 'Ball Recoveries',     category: 'DEF', higherIsBetter: true  },
  { key: 'possessionWonAttThird',        label: 'Poss. Won Att. 3rd',  category: 'DEF', higherIsBetter: true  },
  { key: 'errorLeadToGoal',             label: 'Errors → Goal',       category: 'DEF', higherIsBetter: false },
  { key: 'errorLeadToShot',             label: 'Errors → Shot',       category: 'DEF', higherIsBetter: false },
  { key: 'fouls',                        label: 'Fouls Committed',     category: 'DEF', higherIsBetter: false },
  { key: 'yellowCards',                  label: 'Yellow Cards',        category: 'DEF', higherIsBetter: false },
  { key: 'redCards',                     label: 'Red Cards',           category: 'DEF', higherIsBetter: false },
  { key: 'cleanSheet',                  label: 'Clean Sheets',        category: 'DEF', higherIsBetter: true  },
  { key: 'goalsConceded',               label: 'Goals Conceded',      category: 'DEF', higherIsBetter: false },

  // ── PASS (Passing & Creativity) ────────────────────────────
  { key: 'accuratePasses',              label: 'Accurate Passes',     category: 'PASS', higherIsBetter: true  },
  { key: 'totalPasses',                 label: 'Total Passes',        category: 'PASS', higherIsBetter: true  },
  { key: 'accuratePassesPercentage',    label: 'Pass Accuracy %',     category: 'PASS', higherIsBetter: true  },
  { key: 'keyPasses',                   label: 'Key Passes',          category: 'PASS', higherIsBetter: true  },
  { key: 'assists',                     label: 'Assists',             category: 'PASS', higherIsBetter: true  },
  { key: 'expectedAssists',             label: 'Expected Assists (xA)',category: 'PASS', higherIsBetter: true  },
  { key: 'bigChancesCreated',           label: 'Big Chances Created', category: 'PASS', higherIsBetter: true  },
  { key: 'accurateCrosses',             label: 'Accurate Crosses',    category: 'PASS', higherIsBetter: true  },
  { key: 'accurateCrossesPercentage',   label: 'Cross Accuracy %',    category: 'PASS', higherIsBetter: true  },
  { key: 'totalCross',                  label: 'Total Crosses',       category: 'PASS', higherIsBetter: true  },
  { key: 'accurateLongBalls',           label: 'Accurate Long Balls', category: 'PASS', higherIsBetter: true  },
  { key: 'accurateLongBallsPercentage', label: 'Long Ball Acc. %',    category: 'PASS', higherIsBetter: true  },
  { key: 'totalLongBalls',              label: 'Total Long Balls',    category: 'PASS', higherIsBetter: true  },
  { key: 'accurateFinalThirdPasses',    label: 'Final Third Passes',  category: 'PASS', higherIsBetter: true  },
  { key: 'passToAssist',                label: 'Passes to Assist',    category: 'PASS', higherIsBetter: true  },
  { key: 'totalAttemptAssist',           label: 'Assist Attempts',     category: 'PASS', higherIsBetter: true  },
  { key: 'possessionLost',              label: 'Possession Lost',     category: 'PASS', higherIsBetter: false },
];

export const STAT_BY_KEY: Record<string, StatDef> = {};
for (const s of STAT_REGISTRY) STAT_BY_KEY[s.key] = s;

export const STAT_CATEGORIES: { key: StatCategory; label: string; color: string; icon: string }[] = [
  { key: 'ATT',  label: 'Attacking',  color: '#DC2626', icon: '⚽' },
  { key: 'DEF',  label: 'Defensive',  color: '#D4A017', icon: '🛡️' },
  { key: 'PASS', label: 'Passing',    color: '#2563EB', icon: '📊' },
];

export function getStatsByCategory(category: StatCategory): StatDef[] {
  return STAT_REGISTRY.filter(s => s.category === category);
}
