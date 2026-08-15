import { useState } from 'react';
import type { SofaScorePlayer } from '../../types';
import { processNLPPlayerQuery } from '../../services/nlpEngine';
import type { NLPExecutionResult } from '../../services/aiProviders';
import {
  Sparkles, Bot, Terminal, Send, ChevronDown, ChevronUp, Check, AlertCircle,
  RefreshCw, Layers, Target, Shield, Activity, UserCheck, BrainCircuit, Cpu, Users
} from 'lucide-react';

interface NLPCompareAssistantProps {
  allPlayers: SofaScorePlayer[];
  onApplyChartConfig: (config: NLPExecutionResult['chartConfig']) => void;
}

const PRESET_QUERIES = [
  { label: '4 Midfield Maestros', prompt: 'Compare Bruno Fernandes, Kevin De Bruyne, Martin Ødegaard, and Cole Palmer across attacking, defensive, and passing metrics.' },
  { label: 'Mainoo vs Rice vs Rodri', prompt: 'Compare Kobbie Mainoo, Declan Rice, and Rodri in defensive stability, duels, and passing accuracy.' },
  { label: 'Højlund vs Isak vs Haaland', prompt: 'Compare Rasmus Højlund, Alexander Isak, and Erling Haaland in xG, goal conversion, and shots inside box.' },
  { label: 'Bruno vs Ødegaard', prompt: 'Compare Bruno Fernandes vs Martin Ødegaard in chance creation, key passes, and xG.' },
];

export default function NLPCompareAssistant({ allPlayers, onApplyChartConfig }: NLPCompareAssistantProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<'auto' | 'gemini' | 'mistral'>('auto');
  const [result, setResult] = useState<NLPExecutionResult | null>(null);
  const [showTrace, setShowTrace] = useState(true);
  const [activeDepartment, setActiveDepartment] = useState<'master' | 'att' | 'def' | 'pass'>('master');
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
        onApplyChartConfig(res.chartConfig);
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

          {/* Department Specialist Agent Tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveDepartment('master')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px', border: activeDepartment === 'master' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: activeDepartment === 'master' ? 'rgba(139,0,0,0.06)' : 'white',
                color: activeDepartment === 'master' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <BrainCircuit size={14} /> Master Synthesis
            </button>
            <button
              onClick={() => setActiveDepartment('att')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px', border: activeDepartment === 'att' ? '2px solid #DC2626' : '1px solid var(--color-border)',
                background: activeDepartment === 'att' ? 'rgba(220,38,38,0.06)' : 'white',
                color: activeDepartment === 'att' ? '#DC2626' : 'var(--color-text-muted)',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Target size={14} /> Attacking Specialist
            </button>
            <button
              onClick={() => setActiveDepartment('def')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px', border: activeDepartment === 'def' ? '2px solid #D4A017' : '1px solid var(--color-border)',
                background: activeDepartment === 'def' ? 'rgba(212,160,23,0.06)' : 'white',
                color: activeDepartment === 'def' ? '#B8860B' : 'var(--color-text-muted)',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Shield size={14} /> Defensive Specialist
            </button>
            <button
              onClick={() => setActiveDepartment('pass')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px', border: activeDepartment === 'pass' ? '2px solid #2563EB' : '1px solid var(--color-border)',
                background: activeDepartment === 'pass' ? 'rgba(37,99,235,0.06)' : 'white',
                color: activeDepartment === 'pass' ? '#2563EB' : 'var(--color-text-muted)',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Activity size={14} /> Passing Specialist
            </button>
          </div>

          {/* Active Department Content */}
          <div style={{
            background: 'white', padding: '20px', borderRadius: '12px',
            border: '1px solid var(--color-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            {activeDepartment === 'master' && <FormattedMarkdown content={result.rawResponseText} />}
            {activeDepartment === 'att' && <FormattedMarkdown content={result.departmentReports?.attacking || 'No attacking breakdown available.'} />}
            {activeDepartment === 'def' && <FormattedMarkdown content={result.departmentReports?.defensive || 'No defensive breakdown available.'} />}
            {activeDepartment === 'pass' && <FormattedMarkdown content={result.departmentReports?.passing || 'No passing breakdown available.'} />}

            {/* Quick Chart Trigger Button */}
            {result.chartConfig && (
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Auto-selected <strong>10 differentiative characteristics</strong> for {result.chartConfig?.vizType ? result.chartConfig.vizType.toUpperCase() : 'PIZZA'} chart
                </span>
                <button
                  onClick={() => onApplyChartConfig(result.chartConfig)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px',
                    background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                    fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                >
                  <Sparkles size={12} /> Sync Interactive Chart
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function expandMashedTables(content: string): string {
  // Heuristic: If content has a table separator but is mashed, insert newlines between row boundaries "| |"
  if (/\|\s*[-:]+[-:| ]+[-:]+\s*\|/.test(content)) {
    return content.replace(/\|\s+\|/g, '|\n|');
  }
  return content;
}

function FormattedMarkdown({ content }: { content: string }) {
  if (!content) return null;

  const fixedContent = expandMashedTables(content);
  const blocks = fixedContent.split(/\n\n+/);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Hero Header (# ...)
        if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
          return (
            <div key={bIdx} style={{
              background: 'linear-gradient(135deg, #1E1E2E 0%, #181825 100%)',
              color: 'white',
              padding: '16px 20px',
              borderRadius: '12px',
              borderLeft: '5px solid var(--color-primary)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              marginBottom: '4px'
            }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#89B4FA', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BrainCircuit size={14} /> Executive AI Tactical Comparison
              </div>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#CDD6F4', lineHeight: 1.3 }}>
                {renderInline(trimmed.slice(2))}
              </h1>
            </div>
          );
        }

        // Sub-sub-headers (#### ...)
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={bIdx} style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text)', margin: '8px 0 2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 4, height: 16, borderRadius: 2, background: 'var(--color-primary)', display: 'inline-block' }} />
              {renderInline(trimmed.slice(5))}
            </h4>
          );
        }

        // Section Subheaders (### ...)
        if (trimmed.startsWith('### ')) {
          const titleText = trimmed.slice(4);
          let Icon = Target;
          if (titleText.toLowerCase().includes('defensive')) Icon = Shield;
          else if (titleText.toLowerCase().includes('passing') || titleText.toLowerCase().includes('creative')) Icon = Activity;
          else if (titleText.toLowerCase().includes('master') || titleText.toLowerCase().includes('verdict')) Icon = BrainCircuit;

          return (
            <div key={bIdx} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              paddingBottom: '6px', borderBottom: '2px solid rgba(139,0,0,0.15)',
              margin: '10px 0 2px'
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '6px',
                background: 'rgba(139,0,0,0.1)', color: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={14} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
                {renderInline(titleText)}
              </h3>
            </div>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={bIdx} style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', margin: '10px 0 4px' }}>
              {renderInline(trimmed.slice(3))}
            </h2>
          );
        }

        // Verdict Callout Box
        if (trimmed.includes('Verdict:**') || trimmed.includes('Synthesis')) {
          return (
            <div key={bIdx} style={{
              background: 'linear-gradient(135deg, rgba(139,0,0,0.04) 0%, rgba(0,0,0,0.01) 100%)',
              borderLeft: '4px solid var(--color-primary)',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '0.88rem',
              lineHeight: '1.5',
              color: 'var(--color-text)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              {renderInline(trimmed)}
            </div>
          );
        }

        // Markdown Table Block — detect lines with pipe-delimited content
        const lines = trimmed.split('\n');
        // A line is a "table line" if it starts with | OR contains 3+ pipe characters
        const isTableLine = (l: string) => {
          const t = l.trim();
          if (t.startsWith('|')) return true;
          // Count pipes - if 3+ pipes, it's likely a table row even without leading |
          const pipeCount = (t.match(/\|/g) || []).length;
          return pipeCount >= 3;
        };
        const isSeparatorLine = (l: string) => /^[\s|:*\-]+$/.test(l.trim().replace(/^\|/, '').replace(/\|$/, ''));

        const tableLines = lines.filter(l => isTableLine(l));
        if (tableLines.length >= 2) {
          // Normalize all table lines to start/end with |
          const normalizeTableLine = (l: string) => {
            let t = l.trim();
            if (!t.startsWith('|')) t = '| ' + t;
            if (!t.endsWith('|')) t = t + ' |';
            return t;
          };

          const normTableLines = tableLines.map(normalizeTableLine);
          
          // Find the separator line (contains only |, :, -, spaces)
          let sepIdx = normTableLines.findIndex((l, i) => i > 0 && isSeparatorLine(l));
          if (sepIdx < 0) sepIdx = 1; // Assume second line is separator

          const headerLine = normTableLines[0];
          const alignLine = normTableLines[sepIdx];
          const bodyLines = normTableLines.filter((_, i) => i !== 0 && i !== sepIdx);

          const headers = headerLine.split('|').slice(1, -1).map(h => h.trim());
          
          // AI Hallucination Safeguard: If the table has more than 9 columns, it's likely a corrupted text block
          // where the AI mistakenly inserted pipes between words. Render it as a text block instead.
          if (headers.length > 9) {
            return (
              <div key={bIdx} style={{ fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--color-text)' }}>
                {lines.map((line, lIdx) => {
                  const cleaned = line.replace(/\|/g, ' ').replace(/\s{2,}/g, ' ').trim();
                  return (
                    <div key={lIdx} style={{ marginBottom: lIdx < lines.length - 1 ? '4px' : 0 }}>
                      {renderInline(cleaned)}
                    </div>
                  );
                })}
              </div>
            );
          }

          const aligns = alignLine ? alignLine.split('|').slice(1, -1).map(a => {
            const trimmedA = a.trim();
            if (trimmedA.startsWith(':') && trimmedA.endsWith(':')) return 'center';
            if (trimmedA.endsWith(':')) return 'right';
            return 'left';
          }) : [];

          const nonTableLinesBefore = lines.filter(l => !isTableLine(l) && lines.indexOf(l) < lines.indexOf(tableLines[0]));
          const nonTableLinesAfter = lines.filter(l => !isTableLine(l) && lines.indexOf(l) > lines.indexOf(tableLines[tableLines.length - 1]));

          return (
            <div key={bIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '100%' }}>
              {nonTableLinesBefore.map((l, lIdx) => (
                <div key={`before-${lIdx}`} style={{ fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--color-text)' }}>{renderInline(l)}</div>
              ))}

              <div style={{ overflowX: 'auto', maxWidth: '100%', margin: '8px 0', borderRadius: '10px', border: '1px solid var(--color-border)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg, rgba(139,0,0,0.06) 0%, rgba(20,20,25,0.03) 100%)', borderBottom: '2px solid var(--color-border)' }}>
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} style={{ padding: '10px 12px', textAlign: (aligns[hIdx] as any) || 'left', fontWeight: 800, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                          {renderInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bodyLines.map((row, rIdx) => {
                      const cells = row.split('|').slice(1, -1).map(c => c.trim());
                      return (
                        <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? 'white' : 'rgba(0,0,0,0.015)', borderBottom: rIdx < bodyLines.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                          {cells.map((cell, cIdx) => (
                            <td key={cIdx} style={{ padding: '9px 12px', textAlign: (aligns[cIdx] as any) || 'left' }}>
                              {renderInline(cell)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {nonTableLinesAfter.map((l, lIdx) => (
                <div key={`after-${lIdx}`}>{renderInline(l)}</div>
              ))}
            </div>
          );
        }

        const isBulletList = lines.every(l => l.trim().startsWith('- ') || l.trim().startsWith('* '));

        if (isBulletList) {
          return (
            <ul key={bIdx} style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {lines.map((l, lIdx) => (
                <li key={lIdx} style={{ fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--color-text)' }}>
                  {renderInline(l.trim().replace(/^[-*]\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <div key={bIdx} style={{ fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--color-text)' }}>
            {lines.map((line, lIdx) => {
              const lTrim = line.trim();
              if (lTrim.startsWith('- ') || lTrim.startsWith('* ')) {
                return (
                  <div key={lIdx} style={{ display: 'flex', gap: '6px', marginLeft: '12px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>•</span>
                    <span>{renderInline(lTrim.replace(/^[-*]\s+/, ''))}</span>
                  </div>
                );
              }
              return (
                <div key={lIdx} style={{ marginBottom: lIdx < lines.length - 1 ? '4px' : 0 }}>
                  {renderInline(line)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function renderInline(text: string): (string | React.ReactNode)[] {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i} style={{ fontWeight: 800, color: 'var(--color-text)' }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i} style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} style={{
          background: '#1E1E2E',
          color: '#89B4FA',
          padding: '2px 8px',
          borderRadius: '6px',
          fontSize: '0.78rem',
          fontFamily: 'monospace',
          border: '1px solid #313244',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          maxWidth: '100%',
          display: 'inline-block'
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

