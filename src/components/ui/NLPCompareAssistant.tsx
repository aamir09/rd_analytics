import React, { useState } from 'react';
import {
  Bot, Terminal, Send, ChevronDown, ChevronUp, Check, AlertCircle,
  RefreshCw, Layers, Target, Shield, Activity, Cpu, Users, User, Maximize2, Flame, Zap, PieChart, ScatterChart, Key, Edit2, Trash2
} from 'lucide-react';
import { findMatchingPlayer, extractPlayerCandidatesFromQuery } from '../../services/nlpEngine';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PizzaChart from '../charts/PizzaChart';
import PercentileBarChart from '../charts/PercentileBarChart';
import BeeswarmPlot from '../charts/BeeswarmPlot';
import ScatterPlotChart from '../charts/ScatterPlot';
import type { SofaScorePlayer } from '../../types';
import { processNLPPlayerQuery } from '../../services/nlpEngine';
import type { NLPExecutionResult } from '../../services/aiProviders';
import { STAT_BY_KEY } from '../../data/statRegistry';

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

  // API Key Management State
  const [customKey, setCustomKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);

  React.useEffect(() => {
    // When provider changes, fetch the current custom key from session storage
    if (typeof window !== 'undefined') {
      const activeProvider = provider === 'auto' ? 'gemini' : provider;
      const storedKey = sessionStorage.getItem(`custom_${activeProvider}_key`);
      setCustomKey(storedKey || null);
      setKeyInput('');
      setIsEditingKey(false);
    }
  }, [provider]);

  const handleSaveKey = () => {
    if (!keyInput.trim()) return;
    const activeProvider = provider === 'auto' ? 'gemini' : provider;
    sessionStorage.setItem(`custom_${activeProvider}_key`, keyInput.trim());
    setCustomKey(keyInput.trim());
    setIsEditingKey(false);
    setKeyInput('');
  };

  const handleDeleteKey = () => {
    const activeProvider = provider === 'auto' ? 'gemini' : provider;
    sessionStorage.removeItem(`custom_${activeProvider}_key`);
    setCustomKey(null);
    setIsEditingKey(false);
  };

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

        {/* Model selector and API Key Management */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          
          {/* API Key UI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '4px 10px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
            {customKey && !isEditingKey ? (
              <>
                <Key size={14} style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text)', fontFamily: 'monospace' }}>
                  *** ({provider === 'auto' ? 'Gemini 2.5' : provider === 'mistral' ? 'Mistral' : 'Gemini 2.5'} Key)
                </span>
                <button onClick={() => setIsEditingKey(true)} title="Update Key" style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}>
                  <Edit2 size={12} />
                </button>
                <button onClick={handleDeleteKey} title="Delete Key" style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-primary)' }}>
                  <Trash2 size={12} />
                </button>
              </>
            ) : (
              <>
                <Key size={14} style={{ color: 'var(--color-text-muted)' }} />
                <input
                  type="password"
                  placeholder={`Enter ${provider === 'mistral' ? 'Mistral' : 'Gemini'} Key...`}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveKey(); }}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', outline: 'none', width: '150px' }}
                />
                {isEditingKey && (
                  <button onClick={() => { setIsEditingKey(false); setKeyInput(''); }} style={{ background: 'none', border: 'none', fontSize: '0.7rem', color: 'var(--color-text-muted)', cursor: 'pointer' }}>Cancel</button>
                )}
              </>
            )}
          </div>
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
          {/* Title */}
          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bot size={28} /> AI Copilot Comparison
            </h2>
            <p style={{ color: '#475569', fontSize: '1.05rem', margin: 0 }}>
              Powered by {result.providerUsed === 'gemini' ? 'Gemini 3.6 Flash' : result.providerUsed === 'mistral' ? 'Mistral Large' : 'Local Fallback'} NLP Engine
            </p>
          </div>

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
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Ran {result.toolTrace.length} Multi-Agent Sub-Tasks
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowTrace(!showTrace)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <Terminal size={12} /> {showTrace ? 'Hide Agent Trace' : 'Show Agent Trace'}
                {showTrace ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              <button
                onClick={handleCopyText}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {copied ? <Check size={12} /> : <Layers size={12} />}
                {copied ? 'Copied' : 'Copy Insights'}
              </button>
            </div>
          </div>

          {/* Multi-Agent Trace Log */}
          {showTrace && result.toolTrace.length > 0 && (
            <div style={{
              background: '#0f172a', color: '#94a3b8', padding: '14px', borderRadius: '10px',
              fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: '16px', border: '1px solid #313244',
              overflowX: 'auto', maxWidth: '100%', maxHeight: '300px', overflowY: 'auto'
            }}>
              <div style={{ color: '#f8fafc', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={14} color="#89B4FA" /> Multi-Agent Execution Pipeline:
              </div>
              {result.toolTrace.map(t => (
                <div key={t.step} style={{ marginBottom: '6px', borderLeft: '2px solid #89B4FA', paddingLeft: '8px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                  <span style={{ color: '#F9E2AF' }}>[{t.timestamp}]</span>{' '}
                  <span style={{ color: '#A6E3A1', fontWeight: 700 }}>{t.toolName}</span>(
                  <span style={{ color: '#FAB387' }}>{JSON.stringify(t.args)}</span>
                  ) → <span style={{ color: '#f8fafc' }}>{t.resultSummary}</span>
                </div>
              ))}
            </div>
          )}

          {/* EXPERIMENT DASHBOARD LAYOUT */}
          {(() => {
            const chartConfig: any = result.chartConfig || {};
            let pA = chartConfig.playerA ? findMatchingPlayer(chartConfig.playerA, allPlayers) : undefined;
            let pB = chartConfig.playerB ? findMatchingPlayer(chartConfig.playerB, allPlayers) : undefined;
            let pC = chartConfig.playerC ? findMatchingPlayer(chartConfig.playerC, allPlayers) : undefined;
            let pD = chartConfig.playerD ? findMatchingPlayer(chartConfig.playerD, allPlayers) : undefined;
            
            if (!pA && result.comparisonData?.comparedPlayers?.length > 0) {
              const compPlayers = result.comparisonData.comparedPlayers;
              pA = compPlayers[0] ? findMatchingPlayer(compPlayers[0].player, allPlayers) : undefined;
              pB = compPlayers[1] ? findMatchingPlayer(compPlayers[1].player, allPlayers) : undefined;
              pC = compPlayers[2] ? findMatchingPlayer(compPlayers[2].player, allPlayers) : undefined;
              pD = compPlayers[3] ? findMatchingPlayer(compPlayers[3].player, allPlayers) : undefined;
            }

            if (!pA && query) {
              const extracted = extractPlayerCandidatesFromQuery(query, allPlayers);
              pA = extracted[0];
              pB = extracted[1];
              pC = extracted[2];
              pD = extracted[3];
            }

            const playersForChart = [pA, pB, pC, pD].filter(Boolean) as SofaScorePlayer[];
            const defaultStats = ['goals', 'expectedGoals', 'assists', 'keyPasses', 'tackles', 'interceptions', 'successfulDribbles', 'accuratePassesPercentage'];
            const activeStats = (chartConfig.selectedStats?.length > 0) ? chartConfig.selectedStats : defaultStats;
            
            const beeswarmMetric = chartConfig.xMetric || 'expectedGoals';
            const scatterX = chartConfig.xMetric || 'expectedGoals';
            const scatterY = chartConfig.yMetric || 'goals';
            
            const masterReport = result.rawResponseText || '';
            const splitMatch = masterReport.match(/([\s\S]*?)(### Category Highlights|## Category Highlights|Category Highlights|1\. Attacking & Goal Threat)([\s\S]*)/i);
            const introReport = splitMatch ? splitMatch[1] : masterReport;
            const bodyReport = splitMatch ? splitMatch[2] + (splitMatch[3] || '') : '';

            return (
              <div className="fade-in" style={{ marginTop: '32px' }}>
                {/* VS Player Headshots Banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                  {playersForChart.map((p, idx) => {
                    const isLast = idx === playersForChart.length - 1;
                    return (
                      <React.Fragment key={p.player_id}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', width: '160px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', overflow: 'hidden', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #dc2626' }}>
                            {photoMap[p.player_name.trim().toLowerCase()] ? (
                              <img src={photoMap[p.player_name.trim().toLowerCase()]} alt={p.player_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <User size={40} color="#94a3b8" />
                            )}
                          </div>
                          <div style={{ fontWeight: 800, color: '#0f172a', textAlign: 'center', fontSize: '1.05rem', lineHeight: '1.2' }}>{p.player_name}</div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px', textAlign: 'center' }}>{p.team_name}</div>
                        </div>
                        {!isLast && (
                          <div style={{ color: '#dc2626', fontWeight: 900, fontSize: '1.5rem', fontStyle: 'italic', padding: '0 8px' }}>VS</div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Master Report (Hero Intel Card) - Intro */}
                <div style={{ background: '#ffffff', border: '1px solid #dc2626', borderRadius: '12px', padding: '32px', marginBottom: '32px', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', color: '#dc2626', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '1px' }}>
                    <Flame size={26} /> MASTER SYNTHESIZER VERDICT
                  </div>
                  <div className="futuristic-prose light-mode" style={{ fontSize: '1.05rem', lineHeight: '1.7', color: '#0f172a' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{introReport}</ReactMarkdown>
                  </div>
                </div>

                {/* Bar & Pizza Chart Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: '24px', marginBottom: '32px' }}>
                  {/* Percentile Comparison Bars */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#dc2626', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                      <Zap size={20} color="#dc2626" /> Cross-Category Percentile Spectrum
                    </div>
                    <div style={{ flex: 1, minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PercentileBarChart 
                        players={playersForChart} 
                        allPlayers={allPlayers} 
                        selectedStats={activeStats} 
                        layout="horizontal"
                      />
                    </div>
                  </div>

                  {/* Pizza Chart */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#dc2626', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                      <PieChart size={20} color="#dc2626" /> Tactical Swarm Profile
                    </div>
                    <div style={{ flex: 1, background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PizzaChart 
                        players={playersForChart}
                        allPlayers={allPlayers}
                        selectedStats={activeStats} 
                      />
                    </div>
                  </div>
                </div>

                {/* Body Report */}
                {bodyReport && (
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div className="futuristic-prose light-mode" style={{ color: '#0f172a' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyReport}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Beeswarm & Scatter Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', marginBottom: '40px' }}>
                  {/* Beeswarm */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 700, fontSize: '1.1rem' }}>
                        <Activity size={20} color="#dc2626" /> League Distribution ({STAT_BY_KEY[beeswarmMetric]?.label || beeswarmMetric})
                      </div>
                      <button 
                        onClick={() => onExpandChart && onExpandChart({ type: 'beeswarm', props: { metric: beeswarmMetric, highlightPlayers: playersForChart, allPlayers } })}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Maximize2 size={18} />
                      </button>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', minHeight: '300px', display: 'flex', alignItems: 'center' }}>
                      <BeeswarmPlot 
                        metric={beeswarmMetric}
                        highlightPlayers={playersForChart}
                        allPlayers={allPlayers}
                      />
                    </div>
                  </div>

                  {/* Scatter */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 700, fontSize: '1.1rem' }}>
                        <ScatterChart size={20} color="#dc2626" /> {STAT_BY_KEY[scatterY]?.label || scatterY} vs {STAT_BY_KEY[scatterX]?.label || scatterX}
                      </div>
                      <button 
                        onClick={() => onExpandChart && onExpandChart({ type: 'scatter', props: { xMetric: scatterX, yMetric: scatterY, highlightPlayers: playersForChart, allPlayers } })}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <Maximize2 size={18} />
                      </button>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', minHeight: '300px' }}>
                      <ScatterPlotChart 
                        xMetric={scatterX}
                        yMetric={scatterY}
                        allPlayers={allPlayers}
                        highlightPlayers={playersForChart}
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-Agent Reports */}
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: 800, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <Terminal size={20} color="#dc2626" /> RAW SUB-AGENT TELEMETRY
                </div>
                <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px' }}>
                  {['attacking', 'defensive', 'passing'].map(dept => {
                    const content = result.departmentReports?.[dept as keyof typeof result.departmentReports];
                    if (!content) return null;
                    return (
                      <div key={dept} style={{ flex: '1 1 0', minWidth: '350px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '400px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                          {dept === 'attacking' ? <Target size={16} color="#dc2626"/> : dept === 'defensive' ? <Shield size={16} color="#dc2626"/> : <Activity size={16} color="#dc2626"/>}
                          {dept} NODE
                        </div>
                        <div className="futuristic-prose light-mode" style={{ padding: '20px', overflowY: 'auto', flex: 1, minHeight: 0, fontSize: '0.9rem', color: '#0f172a' }}>
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
