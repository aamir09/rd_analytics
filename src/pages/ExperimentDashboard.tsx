import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import type { SofaScorePlayer } from '../types';
import { usePlayerPhotos } from '../hooks/usePlayerPhotos';
import PizzaChart from '../components/charts/PizzaChart';
import BeeswarmPlot from '../components/charts/BeeswarmPlot';
import PercentileBarChart from '../components/charts/PercentileBarChart';
import ScatterPlot from '../components/charts/ScatterPlot';
import { Bot, BarChart3, Users, Flame, PieChart, Activity, Cpu, Shield, Zap, ScatterChart, Maximize2, X, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ErrorBoundary from '../components/ui/ErrorBoundary';

export default function ExperimentDashboard() {
  const { data: results, loading: resultsLoading } = useData<any>('experiment_results.json');
  const { data: sofaData, loading: sofaLoading } = useData<SofaScorePlayer[]>('sofascore/2526_player_stats.json');
  const { data: apiData } = useData<any>('2425_player_stats.json');
  
  const photoMap = usePlayerPhotos(apiData);

  const [activeTab, setActiveTab] = useState<'tc1' | 'tc2'>('tc1');
  const [expandedChart, setExpandedChart] = useState<{ type: 'beeswarm' | 'scatter'; props: any } | null>(null);

  const allPlayers = useMemo(() => {
    if (!sofaData) return [];
    return sofaData.filter(p => p.statistics && (p.statistics.minutesPlayed ?? 0) > 0);
  }, [sofaData]);

  if (resultsLoading || sofaLoading) {
    return (
      <div className="page-wrapper" style={{ background: '#090d16', minHeight: '100vh', color: '#e2e8f0' }}>
        <div className="container" style={{ padding: '80px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', borderColor: '#38bdf8', borderTopColor: 'transparent' }} />
          <h2 style={{ color: '#38bdf8', letterSpacing: '2px', fontWeight: 600 }}>INITIALIZING SWARM PROTOCOLS...</h2>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="page-wrapper" style={{ background: '#090d16', minHeight: '100vh', color: '#e2e8f0' }}>
        <div className="container">
          <div className="card" style={{ padding: '60px', textAlign: 'center', background: '#1e293b', border: '1px solid #ef4444' }}>
            <h2 style={{ color: '#ef4444', marginBottom: '12px' }}>DATA PAYLOAD MISSING</h2>
            <p style={{ color: '#94a3b8' }}>Please execute the Node Multi-Agent script to generate the telemetry payload.</p>
          </div>
        </div>
      </div>
    );
  }

  const { testCase1, testCase2 } = results;

  const renderTestCase1 = () => {
    if (!testCase1) return <div style={{ color: '#94a3b8' }}>NO TELEMETRY FOR TEST CASE 1</div>;
    const { report, matchedPlayers, chartConfig } = testCase1;
    
    const pA = allPlayers.find(p => p.player_name === chartConfig.playerA);
    const pB = allPlayers.find(p => p.player_name === chartConfig.playerB);
    const playersForChart = [pA, pB].filter(Boolean) as SofaScorePlayer[];

    return (
      <div className="fade-in">
        {/* Header Hero */}
        <div style={{ background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(15, 23, 42, 1))', border: '1px solid #334155', borderLeft: '4px solid #ef4444', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc' }}>
            <Cpu size={24} color="#ef4444" />
            ATTACKING SPECIALIST PROTOCOL
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
            <strong>Query:</strong> <span style={{ color: '#cbd5e1' }}>"{testCase1.query}"</span> <br />
            <strong>Resolved Entities:</strong> <span style={{ color: '#38bdf8' }}>{matchedPlayers.join(' vs ')}</span>
          </p>
        </div>

        {/* VS Player Headshots Banner */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', marginBottom: '32px', padding: '32px', background: '#090d16', border: '1px solid #334155', borderRadius: '12px' }}>
          {playersForChart.map((p, idx) => {
            const photo = photoMap[p.player_name.toLowerCase().trim()];
            return (
              <React.Fragment key={p.player_name}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: 100, height: 100, marginBottom: '16px' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `3px solid ${['#ef4444', '#38bdf8', '#10b981'][idx]}`, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, left: 0 }}>
                      <User size={48} color="#64748b" />
                    </div>
                    {photo && (
                      <img 
                        src={photo} 
                        alt={p.player_name} 
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1, border: `3px solid ${['#ef4444', '#38bdf8', '#10b981'][idx]}` }} 
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

        {/* Split Section: Visualization + AI Report */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
          {/* Visualization Column */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
            {/* Pizza Chart */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#f8fafc', fontWeight: 700 }}>
              <PieChart size={18} color="#ef4444" /> Tactical Radar
            </div>
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155', marginBottom: '24px' }}>
              <PizzaChart 
                players={playersForChart}
                allPlayers={allPlayers}
                selectedStats={chartConfig.selectedStats}
              />
            </div>

            {/* Percentile Bar Chart */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#f8fafc', fontWeight: 700, fontSize: '1.1rem' }}>
              <BarChart3 size={20} color="#38bdf8" /> Attacking Metrics Percentile Head-to-Head
            </div>
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155' }}>
              <PercentileBarChart 
                players={playersForChart} 
                allPlayers={allPlayers} 
                selectedStats={chartConfig.selectedStats} 
              />
            </div>

            {/* Beeswarm Plot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: 700, fontSize: '1.1rem' }}>
                <Activity size={20} color="#10b981" /> League Distribution (Expected Goals)
              </div>
              <button 
                onClick={() => setExpandedChart({ type: 'beeswarm', props: { metric: 'expectedGoals', highlightPlayers: [pA].filter(Boolean), allPlayers } })}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Expand Chart"
              >
                <Maximize2 size={18} />
              </button>
            </div>
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', minHeight: '300px', display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <BeeswarmPlot 
                metric="expectedGoals"
                highlightPlayers={[pA].filter(Boolean) as SofaScorePlayer[]}
                allPlayers={allPlayers}
              />
            </div>

            {/* Scatter Plot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: 700, fontSize: '1.1rem' }}>
                <ScatterChart size={20} color="#f43f5e" /> Goals vs Expected Goals (xG)
              </div>
              <button 
                onClick={() => setExpandedChart({ type: 'scatter', props: { xMetric: 'expectedGoals', yMetric: 'goals', highlightPlayers: playersForChart, allPlayers } })}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Expand Chart"
              >
                <Maximize2 size={18} />
              </button>
            </div>
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', border: '1px solid #334155', minHeight: '300px' }}>
              <ScatterPlot 
                xMetric="expectedGoals"
                yMetric="goals"
                allPlayers={allPlayers}
                highlightPlayers={playersForChart}
              />
            </div>
          </div>

          {/* AI Report Column */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: '#f8fafc', fontWeight: 700, fontSize: '1.2rem' }}>
              <Bot size={22} color="#34d399" /> Agent Intelligence Report
            </div>
            <div className="futuristic-prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTestCase2 = () => {
    if (!testCase2) return <div style={{ color: '#94a3b8' }}>NO TELEMETRY FOR TEST CASE 2</div>;
    const { masterReport, matchedPlayers, chartConfig, subAgentReports } = testCase2;

    const pA = allPlayers.find(p => p.player_name === chartConfig.playerA);
    const pB = allPlayers.find(p => p.player_name === chartConfig.playerB);
    const pC = allPlayers.find(p => p.player_name === chartConfig.playerC);
    const playersForChart = [pA, pB, pC].filter(Boolean) as SofaScorePlayer[];

    const splitMatch = masterReport.match(/([\s\S]*?)(### Category Highlights|## Category Highlights|Category Highlights|1\. Attacking & Goal Threat)([\s\S]*)/i);
    const introReport = splitMatch ? splitMatch[1] : masterReport;
    const bodyReport = splitMatch ? splitMatch[2] + splitMatch[3] : '';

    return (
      <div className="fade-in">
        {/* Header Hero */}
        <div style={{ background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(15, 23, 42, 1))', border: '1px solid #334155', borderLeft: '4px solid #0284c7', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc' }}>
            <Users size={24} color="#0284c7" />
            MULTI-AGENT SWARM (3-FRONT PROTOCOL)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
            <strong>Query:</strong> <span style={{ color: '#cbd5e1' }}>"{testCase2.query}"</span> <br />
            <strong>Resolved Entities:</strong> <span style={{ color: '#38bdf8' }}>{matchedPlayers.join(' · ')}</span>
          </p>
        </div>

        {/* VS Player Headshots Banner */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '32px', marginBottom: '32px', padding: '32px', background: '#090d16', border: '1px solid #334155', borderRadius: '12px', flexWrap: 'wrap' }}>
          {playersForChart.map((p, idx) => {
            const photo = photoMap[p.player_name.toLowerCase().trim()];
            return (
              <React.Fragment key={p.player_name}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ position: 'relative', width: 100, height: 100, marginBottom: '16px' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `3px solid ${['#ef4444', '#38bdf8', '#10b981'][idx]}`, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, left: 0 }}>
                      <User size={48} color="#64748b" />
                    </div>
                    {photo && (
                      <img 
                        src={photo} 
                        alt={p.player_name} 
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, zIndex: 1, border: `3px solid ${['#ef4444', '#38bdf8', '#10b981'][idx]}` }} 
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
                selectedStats={chartConfig.selectedStats} 
                layout="horizontal"
              />
            </div>
          </div>

          {/* Pizza Chart */}
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#f8fafc', fontWeight: 700 }}>
              <PieChart size={18} color="#0284c7" /> Swarm Profile Radar
            </div>
            <div style={{ background: '#1e293b', borderRadius: '12px', padding: '16px', border: '1px solid #334155' }}>
              <PizzaChart 
                players={playersForChart}
                allPlayers={allPlayers}
                selectedStats={chartConfig.selectedStats}
              />
            </div>
          </div>
        </div>

        {/* Master Report (Hero Intel Card) - Body (Category Highlights) */}
        {bodyReport && (
          <div style={{ background: '#0f172a', border: '1px solid #0284c7', borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
            <div className="futuristic-prose" style={{ fontSize: '1.05rem', lineHeight: '1.7' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyReport}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Full-width Beeswarm */}
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: 700, fontSize: '1.1rem' }}>
               <Activity size={20} color="#10b981" /> Expected Goals (xG) League Distribution
             </div>
             <button 
                onClick={() => setExpandedChart({ type: 'beeswarm', props: { metric: 'expectedGoals', highlightPlayers: [pA].filter(Boolean), allPlayers } })}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Expand Chart"
              >
                <Maximize2 size={18} />
              </button>
          </div>
          <div style={{ background: '#1e293b', borderRadius: '12px', padding: '24px', minHeight: '350px', display: 'flex', alignItems: 'center', border: '1px solid #334155' }}>
            <BeeswarmPlot 
              metric="expectedGoals"
              highlightPlayers={[pA].filter(Boolean) as SofaScorePlayer[]}
              allPlayers={allPlayers}
            />
          </div>
        </div>

        {/* Sub-Agent Raw Logs */}
        <div style={{ background: '#090d16', border: '1px solid #334155', borderRadius: '12px', padding: '32px', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '24px', color: '#cbd5e1', fontWeight: 700, letterSpacing: '1px' }}>RAW SUB-AGENT TELEMETRY</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
            {[
              { title: 'Attacking Agent', icon: Flame, text: subAgentReports.attack, color: '#ef4444' },
              { title: 'Defensive Agent', icon: Shield, text: subAgentReports.defense, color: '#10b981' },
              { title: 'Passing Agent', icon: Bot, text: subAgentReports.passing, color: '#3b82f6' }
            ].map(agent => (
              <div key={agent.title} style={{ background: '#0f172a', padding: '20px', borderRadius: '8px', border: `1px solid ${agent.color}40`, display: 'flex', flexDirection: 'column', height: '400px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: agent.color, fontWeight: 700, marginBottom: '16px', fontSize: '0.9rem', textTransform: 'uppercase', flexShrink: 0 }}>
                  <agent.icon size={18} /> {agent.title}
                </div>
                <div className="futuristic-prose" style={{ flex: 1, minHeight: 0, fontSize: '0.8rem', color: '#94a3b8', overflowY: 'auto', overflowX: 'hidden', paddingRight: '12px', paddingBottom: '12px' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{agent.text}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: '#020617', minHeight: '100vh', paddingBottom: '80px' }}>
      <div className="container" style={{ paddingTop: '100px' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ color: '#f8fafc', fontSize: '2.4rem', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-1px' }}>Multi-Agent <span style={{ color: '#38bdf8' }}>Swarm UI</span></h1>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '800px', lineHeight: '1.6' }}>
            Advanced architectural visualization of two-stage entity resolution and swarm orchestration. 
            Powered by phonetic matching, LLM agents, and Recharts.
          </p>
        </div>

        {/* Futuristic Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', borderBottom: '1px solid #334155', paddingBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('tc1')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: activeTab === 'tc1' ? '1px solid #ef4444' : '1px solid transparent',
              background: activeTab === 'tc1' ? 'rgba(239, 68, 68, 0.15)' : '#0f172a',
              color: activeTab === 'tc1' ? '#f8fafc' : '#94a3b8',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '0.5px'
            }}
          >
            TC1: SINGLE AGENT
          </button>
          <button
            onClick={() => setActiveTab('tc2')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: activeTab === 'tc2' ? '1px solid #0284c7' : '1px solid transparent',
              background: activeTab === 'tc2' ? 'rgba(2, 132, 199, 0.15)' : '#0f172a',
              color: activeTab === 'tc2' ? '#f8fafc' : '#94a3b8',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '0.5px'
            }}
          >
            TC2: 3-FRONT SWARM
          </button>
        </div>

        <ErrorBoundary fallbackTitle="Dashboard Render Error">
          {activeTab === 'tc1' ? renderTestCase1() : renderTestCase2()}
        </ErrorBoundary>

      </div>

      {expandedChart && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          background: 'rgba(2,6,23,0.95)', backdropFilter: 'blur(8px)', zIndex: 9999, 
          display: 'flex', flexDirection: 'column', padding: '40px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <button 
              onClick={() => setExpandedChart(null)} 
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#f8fafc', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={24} />
            </button>
          </div>
          <div style={{ 
            flex: 1, background: '#1e293b', borderRadius: '16px', padding: '40px', 
            border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ width: '100%', height: '100%', maxWidth: '1200px', maxHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {expandedChart.type === 'beeswarm' && <BeeswarmPlot {...expandedChart.props} />}
              {expandedChart.type === 'scatter' && <ScatterPlot {...expandedChart.props} width={1000} height={600} />}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .futuristic-prose h1, .futuristic-prose h2, .futuristic-prose h3 {
          color: #f8fafc;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .futuristic-prose p {
          color: #cbd5e1;
          margin-bottom: 1em;
        }
        .futuristic-prose ul {
          padding-left: 1.5em;
          color: #cbd5e1;
          margin-bottom: 1em;
        }
        .futuristic-prose li {
          margin-bottom: 0.5em;
        }
        .futuristic-prose strong {
          color: #f8fafc;
        }
        .futuristic-prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
          font-size: 0.85em;
          table-layout: fixed;
          word-wrap: break-word;
        }
        .futuristic-prose th {
          background: #1e293b;
          color: #38bdf8;
          text-align: left;
          padding: 12px;
          border-bottom: 2px solid #334155;
        }
        .futuristic-prose td {
          padding: 12px;
          border-bottom: 1px solid #334155;
          color: #cbd5e1;
        }
        .futuristic-prose tr:hover td {
          background: rgba(255,255,255,0.02);
        }
        /* Custom scrollbar for raw logs */
        .futuristic-prose::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .futuristic-prose::-webkit-scrollbar-track {
          background: #090d16;
          border-radius: 4px;
        }
        .futuristic-prose::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
