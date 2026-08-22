const fs = require('fs');

const content = `import React, { useState } from 'react';
import { User, Maximize2, PieChart, ScatterChart, Flame, Zap, Bot, Terminal, Send, ChevronDown, ChevronUp, Check, AlertCircle, RefreshCw, Layers, Target, Shield, Activity, Cpu, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PizzaChart from '../charts/PizzaChart';
import PercentileBarChart from '../charts/PercentileBarChart';
import BeeswarmPlot from '../charts/BeeswarmPlot';
import ScatterPlotChart from '../charts/ScatterPlot';
import type { SofaScorePlayer } from '../../types';
import { processNLPPlayerQuery } from '../../services/nlpEngine';
import type { NLPExecutionResult } from '../../services/aiProviders';

interface NLPCompareAssistantProps {
  allPlayers: SofaScorePlayer[];
  photoMap?: Record<string, string>;
  onExpandChart?: (chart: any) => void;
  onApplyChartConfig?: (config: NLPExecutionResult['chartConfig']) => void;
}

const PRESET_QUERIES = [
  { label: '4 Midfield Maestros', prompt: 'Compare Bruno Fernandes, Kevin De Bruyne, Martin Ødegaard, and Cole Palmer across attacking, defensive, and passing metrics.' },
  { label: 'Mainoo vs Rice vs Rodri', prompt: 'Compare Kobbie Mainoo, Declan Rice, and Rodri in defensive stability, duels, and passing accuracy.' },
  { label: 'Højlund vs Isak vs Haaland', prompt: 'Compare Rasmus Højlund, Alexander Isak, and Erling Haaland in xG, goal conversion, and shots inside box.' },
  { label: 'Bruno vs Ødegaard', prompt: 'Compare Bruno Fernandes vs Martin Ødegaard in chance creation, key passes, and xG.' },
];

export default function NLPCompareAssistant({ allPlayers, photoMap = {}, onExpandChart, onApplyChartConfig }: NLPCompareAssistantProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<'auto' | 'gemini' | 'mistral'>('auto');
  const [result, setResult] = useState<NLPExecutionResult | null>(null);
  const [showTrace, setShowTrace] = useState(true);
  
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{ message: string; stack?: string } | null>(null);

  const handleRunQuery = async (queryText?: string) => {
    const q = queryText || query;
    if (!q.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setErrorDetails(null);

    try {
      const res = await processNLPPlayerQuery(q, allPlayers, provider);
      setResult(res);
      if (res.chartConfig) {
        onApplyChartConfig?.(res.chartConfig);
      }
    } catch (err: any) {
      console.error('Error running NLP comparison query:', err);
      const msg = err?.message || String(err) || 'Failed to process NLP query';
      setErrorMsg(msg);
      setErrorDetails({
        message: msg,
        stack: err?.stack || String(err)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!result?.rawResponseText) return;
    navigator.clipboard.writeText(result.rawResponseText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card fade-in" style={{
      background: 'linear-gradient(135deg, rgba(139,0,0,0.03) 0%, rgba(20,20,25,0.02) 100%)',
      border: '1px solid rgba(139,0,0,0.15)',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '32px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.04)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--color-primary), #E63946)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', boxShadow: '0 4px 12px rgba(218,41,28,0.3)'
          }}>
            <Cpu size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                Multi-Agent Player Analytics Copilot
              </h2>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                background: 'rgba(139,0,0,0.1)', color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <Users size={10} /> Up to 4 Players
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              Multi-Agent Engine (Verification, Attacking, Defensive & Passing Agents) powered by Gemini 2.5 & Mistral Large
            </p>
          </div>
        </div>

        {/* Model selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
          <Bot size={14} style={{ color: 'var(--color-primary)' }} />
          <select
            value={provider}
            onChange={e => setProvider(e.target.value as any)}
            style={{ border: 'none', background: 'transparent', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text)', paddingRight: '4px', cursor: 'pointer', outline: 'none' }}
          >
            <option value="auto">Auto (Gemini 2.5 / Mistral Large)</option>
            <option value="gemini">Gemini 2.5 Flash</option>
            <option value="mistral">Mistral Large</option>
          </select>
        </div>
      </div>

      {/* Query input box */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleRunQuery(); }}
          placeholder="e.g. Compare Bruno Fernandes, Kevin De Bruyne, Martin Ødegaard, and Cole Palmer..."
          style={{
            width: '100%',
            padding: '14px 110px 14px 16px',
            borderRadius: '12px',
            border: '2px solid var(--color-border)',
            fontSize: '0.9rem',
            background: 'white',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
            outline: 'none',
            transition: 'all 0.2s'
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
        />
        <button
          onClick={() => handleRunQuery()}
          disabled={loading || !query.trim()}
          style={{
            position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px',
            background: loading || !query.trim() ? 'var(--color-border)' : 'var(--color-primary)',
            color: 'white', border: 'none', fontWeight: 700, fontSize: '0.82rem',
            cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="spinner" /> Analyzing…
            </>
          ) : (
            <>
              <Send size={14} /> Analyze
            </>
          )}
        </button>
      </div>

      {/* Preset Query Chips */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', alignSelf: 'center', marginRight: '4px' }}>
          MULTI-PLAYER PROMPTS:
        </span>
        {PRESET_QUERIES.map(p => (
          <button
            key={p.label}
            onClick={() => {
              setQuery(p.prompt);
              handleRunQuery(p.prompt);
            }}
            style={{
              padding: '6px 12px', borderRadius: '20px',
              border: '1px solid rgba(139,0,0,0.2)',
              background: 'white', fontSize: '0.75rem', fontWeight: 600,
              color: 'var(--color-primary)', cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--color-primary)'; }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {errorMsg && (
        <div style={{ padding: '16px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '0.82rem', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, marginBottom: '8px' }}>
            <AlertCircle size={18} />
            <span>Analysis Query Failure</span>
          </div>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>{errorMsg}</div>
          {errorDetails?.stack && (
            <div style={{
              background: '#1E1E2E', color: '#F38BA8', padding: '12px', borderRadius: '8px',
              fontFamily: 'monospace', fontSize: '0.72rem', overflowX: 'auto', border: '1px solid #313244',
              maxHeight: '200px'
            }}>
              <div style={{ color: '#89B4FA', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Terminal size={12} /> Execution Failure Trace:
              </div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {errorDetails.stack}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Results output */}
      {result && (
        <div className="fade-in" style={{ marginTop: '20px' }}>
          {/* Provider Badge & Trace Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px',
                background: result.providerUsed === 'gemini' ? '#E0F2FE' : result.providerUsed === 'mistral' ? '#F3E8FF' : '#FEF3C7',
                color: result.providerUsed === 'gemini' ? '#0369A1' : result.providerUsed === 'mistral' ? '#6B21A8' : '#92400E',
                textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <Cpu size={12} /> Engine: {result.providerUsed}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                Ran {result.toolTrace.length} Multi-Agent Sub-Tasks
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowTrace(!showTrace)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <Terminal size={12} /> {showTrace ? 'Hide Agent Trace' : 'Show Agent Trace'}
                {showTrace ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              <button
                onClick={handleCopyText}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {copied ? <Check size={12} /> : <Layers size={12} />}
                {copied ? 'Copied' : 'Copy Insights'}
              </button>
            </div>
          </div>

          {/* Multi-Agent Trace Log */}
          {showTrace && result.toolTrace.length > 0 && (
            <div style={{
              background: '#1E1E2E', color: '#A6ADC8', padding: '14px', borderRadius: '10px',
              fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: '16px', border: '1px solid #313244',
              overflowX: 'auto', maxWidth: '100%', maxHeight: '300px', overflowY: 'auto'
            }}>
              <div style={{ color: '#CDD6F4', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={14} color="#89B4FA" /> Multi-Agent Execution Pipeline:
              </div>
              {result.toolTrace.map(t => (
                <div key={t.step} style={{ marginBottom: '6px', borderLeft: '2px solid #89B4FA', paddingLeft: '8px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                  <span style={{ color: '#F9E2AF' }}>[{t.timestamp}]</span>{' '}
                  <span style={{ color: '#A6E3A1', fontWeight: 700 }}>{t.toolName}</span>(
                  <span style={{ color: '#FAB387' }}>{JSON.stringify(t.args)}</span>
                  ) → <span style={{ color: '#CDD6F4' }}>{t.resultSummary}</span>
                </div>
              ))}
            </div>
          )}

          {/* EXPERIMENT DASHBOARD LAYOUT */}
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

fs.writeFileSync('f:/red-devils-analytics/src/components/ui/NLPCompareAssistant.tsx', content);
