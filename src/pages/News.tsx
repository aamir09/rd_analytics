import { useData } from '../hooks/useData';
import type { NewsData } from '../types';
import { useEffect } from 'react';

/* 
// Uncomment this block when you're ready to test Twitter Embeds again
function TwitterEmbed({ screenName, height }: { screenName: string, height: number }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    document.body.appendChild(script);
    
    if ((window as any).twttr) {
      (window as any).twttr.widgets.load();
    }
  }, [screenName]);

  return (
    <div style={{ height, overflowY: 'auto' }}>
      <a 
        className="twitter-timeline" 
        data-theme="light" 
        data-height={height}
        href={`https://twitter.com/${screenName}?ref_src=twsrc%5Etfw`}
      >
        Tweets by {screenName}
      </a>
    </div>
  );
}
*/

export default function News() {
  const { data: newsData, loading } = useData<NewsData>('news.json');
  const articles = newsData?.articles ?? [];

  // Helper to format ISO date
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <div className="accent-bar" />
          <h1 className="text-heading">Manchester United News</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
            Latest updates, transfers, and match reports
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px' }} className="news-grid">
          {/* Main News Section */}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} /> Latest Stories
            </h2>
            
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading news...</div>
            ) : articles.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No news found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {articles.map((article) => (
                  <a key={article.id} href={article.link} target="_blank" rel="noopener noreferrer" className="card hover-scale fade-in" style={{ display: 'flex', overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}>
                    {article.media_url && (
                      <div style={{ width: '200px', flexShrink: 0 }} className="news-img-wrap">
                        <img src={article.media_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{article.source}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{article.published_date ? formatDate(article.published_date) : ''}</span>
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', lineHeight: 1.4 }}>{article.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Social Hub (Temporarily Commented Out) */}
          {/* 
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1DA1F2' }} /> Social Hub
            </h2>
            
            <div className="card fade-in" style={{ overflow: 'hidden', height: '500px', padding: '0' }}>
              <TwitterEmbed screenName="mufcMPB" height={500} />
            </div>
            
            <div className="card fade-in" style={{ overflow: 'hidden', height: '400px', padding: '0' }}>
              <TwitterEmbed screenName="FabrizioRomano" height={400} />
            </div>
            
            <div className="card fade-in" style={{ overflow: 'hidden', height: '400px', padding: '0' }}>
              <TwitterEmbed screenName="indykaila" height={400} />
            </div>
          </div>
          */}
        </div>
      </div>
      <style>{`
        @media(max-width:1024px){
          .news-grid{grid-template-columns:1fr!important}
        }
        @media(max-width:600px){
          .hover-scale{flex-direction:column!important}
          .news-img-wrap{width:100%!important; height:200px!important}
        }
      `}</style>
    </div>
  );
}
