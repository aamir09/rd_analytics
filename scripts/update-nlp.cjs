const fs = require('fs');
const file = 'f:/red-devils-analytics/src/components/ui/NLPCompareAssistant.tsx';
let content = fs.readFileSync(file, 'utf8');

// Imports
content = content.replace(/import \{ useState \} from 'react';/, `import React, { useState } from 'react';
import { User, Maximize2, PieChart, BarChart3, ScatterChart, Flame, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PizzaChart from '../charts/PizzaChart';
import PercentileBarChart from '../charts/PercentileBarChart';
import BeeswarmPlot from '../charts/BeeswarmPlot';
import ScatterPlotChart from '../charts/ScatterPlot';`);

// Props
content = content.replace(/interface NLPCompareAssistantProps \{[\s\S]*?\}/, `interface NLPCompareAssistantProps {
  allPlayers: SofaScorePlayer[];
  photoMap?: Record<string, string>;
  onExpandChart?: (chart: any) => void;
  onApplyChartConfig?: (config: NLPExecutionResult['chartConfig']) => void;
}`);

// Signature
content = content.replace(/export default function NLPCompareAssistant.*\{/, `export default function NLPCompareAssistant({ allPlayers, photoMap = {}, onExpandChart, onApplyChartConfig }: NLPCompareAssistantProps) {`);

// Remove activeDepartment
content = content.replace(/const \[activeDepartment, setActiveDepartment\] = useState[\s\S]*?;/, '');

// Replace render
const renderStart = content.indexOf('{/* Department Specialist Agent Tabs */}');
const renderEnd = content.lastIndexOf('}'); // the end of component

const newRender = `{/* EXPERIMENT DASHBOARD LAYOUT */}
          {(() => {
            const chartConfig = result.chartConfig || {};
            const pA = allPlayers.find(p => p.player_name === chartConfig.playerA);
            const pB = allPlayers.find(p => p.player_name === chartConfig.playerB);
            const pC = allPlayers.find(p => p.player_name === chartConfig.playerC);
            const pD = allPlayers.find(p => p.player_name === chartConfig.playerD);
            const playersForChart = [pA, pB, pC, pD].filter(Boolean) as SofaScorePlayer[];
            
            const masterReport = result.rawResponseText || '';
            const splitMatch = masterReport.match(/([\\s\\S]*?)(### Category Highlights|## Category Highlights|Category Highlights|1\\. Attacking & Goal Threat)([\\s\\S]*)/i);
            const introReport = splitMatch ? splitMatch[1] : masterReport;
            const bodyReport = splitMatch ? splitMatch[2] + (splitMatch[3] || '') : '';

            return (
              <div className="fade-in" style={{ marginTop: '32px' }}>
                {/* VS Player Headshots Banner */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', marginBottom: '32px', padding: '32px', background: '#090d16', border: '1px solid #334155', borderRadius: '12px', flexWrap: 'wrap' }}>
                  {playersForChart.map((p, idx) => {
                    const photo = photoMap[p.player_name.toLowerCase().trim()];
                    return (
                      <React.Fragment key={p.player_name}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                          <div style={{ position: 'relative', width: 100, height: 100, marginBottom: '16px' }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: \`3px solid \${['#ef4444', '#38bdf8', '#10b981', '#f59e0b'][idx]}\`, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, left: 0 }}>
                              <User size={48} color="#64748b" />
                            </div>
                            {photo && (
                              <img 
                                src={photo} 
                                alt={p.player_name} 
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1, border: \`3px solid \${['#ef4444', '#38bdf8', '#10b981', '#f59e0b'][idx]}\` }} 
                                onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} 
                              />
                            )}
                          </div>
                          <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.5px' }}>{p.player_name}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>{p.team_name}</div>
                        </div>
                        {idx < playersForChart.length - 1 && (
                          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#334155', fontStyle: 'italic', padding: '0 20px', letterSpacing: '-2px' }}>VS</div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Master Report (Hero Intel Card) - Intro */}
                <div style={{ background: '#0f172a', border: '1px solid #0284c7', borderRadius: '12px', padding: '32px', marginBottom: '32px', boxShadow: '0 0 40px rgba(2, 132, 199, 0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', color: '#38bdf8', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '1px' }}>
                    <Flame size={26} /> MASTER SYNTHESIZER VERDICT
                  </div>
                  <div className="futuristic-prose" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{introReport}</ReactMarkdown>
                  </div>
                </div>

                {/* Bar & Pizza Chart Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: '24px', marginBottom: '32px' }}>
                  {/* Percentile Comparison Bars */}
                  <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#f8fafc', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                      <Zap size={20} color="#f59e0b" /> Cross-Category Percentile Spectrum
                    </div>
                    <div style={{ flex: 1, minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PercentileBarChart 
                        players={playersForChart} 
                        allPlayers={allPlayers} 
                        selectedStats={chartConfig.selectedStats || []} 
                        layout="horizontal"
                      />
                    </div>
                  </div>

                  {/* Pizza Chart */}
                  <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#f8fafc', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                      <PieChart size={20} color="#ef4444" /> Tactical Swarm Profile
                    </div>
                    <div style={{ flex: 1, background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PizzaChart 
                        players={playersForChart}
                        allPlayers={allPlayers}
                        selectedStats={chartConfig.selectedStats || []} 
                      />
                    </div>
                  </div>
                </div>

                {/* Body Report */}
                {bodyReport && (
                  <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
                    <div className="futuristic-prose">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyReport}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Beeswarm & Scatter Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', marginBottom: '40px' }}>
                  {/* Beeswarm */}
                  <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: 700, fontSize: '1.1rem' }}>
                        <Activity size={20} color="#10b981" /> League Distribution (Expected Goals)
                      </div>
                      <button 
                        onClick={() => onExpandChart && onExpandChart({ type: 'beeswarm', props: { metric: 'expectedGoals', highlightPlayer: pA, allPlayers } })}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Maximize2 size={18} />
                      </button>
                    </div>
                    <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', minHeight: '300px', display: 'flex', alignItems: 'center' }}>
                      <BeeswarmPlot 
                        metric="expectedGoals"
                        highlightPlayer={pA}
                        allPlayers={allPlayers}
                      />
                    </div>
                  </div>

                  {/* Scatter */}
                  <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: 700, fontSize: '1.1rem' }}>
                        <ScatterChart size={20} color="#f43f5e" /> Goals vs xG
                      </div>
                      <button 
                        onClick={() => onExpandChart && onExpandChart({ type: 'scatter', props: { xMetric: 'expectedGoals', yMetric: 'goals', highlightTeam: pA?.team_name || 'Manchester United', allPlayers } })}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Maximize2 size={18} />
                      </button>
                    </div>
                    <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', minHeight: '300px' }}>
                      <ScatterPlotChart 
                        xMetric="expectedGoals"
                        yMetric="goals"
                        allPlayers={allPlayers}
                        highlightTeam={pA?.team_name || "Manchester United"}
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-Agent Reports */}
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: 800, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <Terminal size={20} color="#a855f7" /> RAW SUB-AGENT TELEMETRY
                </div>
                <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px' }}>
                  {['attacking', 'defensive', 'passing'].map(dept => {
                    const content = result.departmentReports?.[dept as keyof typeof result.departmentReports];
                    if (!content) return null;
                    return (
                      <div key={dept} style={{ flex: '1 1 0', minWidth: '350px', background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '400px' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', background: 'rgba(255,255,255,0.02)', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {dept === 'attacking' ? <Target size={16} color="#ef4444"/> : dept === 'defensive' ? <Shield size={16} color="#eab308"/> : <Activity size={16} color="#3b82f6"/>}
                          {dept} NODE
                        </div>
                        <div className="futuristic-prose" style={{ padding: '20px', overflowY: 'auto', flex: 1, minHeight: 0, fontSize: '0.9rem' }}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
`;

content = content.substring(0, renderStart) + newRender;
fs.writeFileSync(file, content);
