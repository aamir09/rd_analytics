import { useData } from '../hooks/useData';
import type { NewsData, TwitterData, TwitterHandleData } from '../types';
import { AtSign, MessageCircle, Repeat2, Heart, BarChart3, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

function TweetSlider({ handleData }: { handleData: TwitterHandleData }) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const formatTimeAgo = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffHrs = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
      if (diffHrs < 24) return `${diffHrs}h`;
      return `${Math.floor(diffHrs/24)}d`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fade-in" style={{ position: 'relative' }}>
      
      {/* Handle Header & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingLeft: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {handleData.tweets[0]?.author.avatar ? (
            <img src={handleData.tweets[0].author.avatar} alt={handleData.screen_name} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--color-border)' }} />
          ) : (
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1DA1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <AtSign size={20} />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {handleData.tweets[0]?.author.name || handleData.screen_name}
            </div>
            <a href={`https://twitter.com/${handleData.screen_name}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#1DA1F2', textDecoration: 'none' }}>
              @{handleData.screen_name}
            </a>
          </div>
        </div>
        
        {/* Navigation Arrows */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => scroll('left')} className="nav-btn" aria-label="Scroll Left">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scroll('right')} className="nav-btn" aria-label="Scroll Right">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Slider */}
      <div ref={sliderRef} className="tweet-slider" style={{ 
        display: 'flex', 
        gap: '20px', 
        overflowX: 'auto', 
        paddingBottom: '16px', 
        scrollSnapType: 'x mandatory',
        scrollBehavior: 'smooth'
      }}>
        {handleData.tweets.map((tweet) => (
          <a 
            key={tweet.id} 
            href={`https://twitter.com/${handleData.screen_name}/status/${tweet.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="card hover-scale tweet-card"
            style={{ 
              minWidth: '320px', 
              maxWidth: '380px',
              flex: '0 0 auto', 
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              textDecoration: 'none',
              color: 'inherit',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <AtSign size={18} color="#1DA1F2" />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatTimeAgo(tweet.created_at)}</span>
            </div>
            
            <p style={{ fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '16px', flex: 1, whiteSpace: 'pre-wrap' }}>
              {tweet.text}
            </p>

            {tweet.media_url && (
              <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', maxHeight: '200px' }}>
                <img src={tweet.media_url} alt="Tweet Media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MessageCircle size={15} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Repeat2 size={15} /> {tweet.retweets ? tweet.retweets.toLocaleString() : ''}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Heart size={15} /> {tweet.favorites ? tweet.favorites.toLocaleString() : ''}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BarChart3 size={15} /> {tweet.views || ''}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function News() {
  const { data: newsData, loading: newsLoading } = useData<NewsData>('news.json');
  const { data: twitterData, loading: twitterLoading } = useData<TwitterData>('twitter.json');
  
  const articles = newsData?.articles ?? [];
  const twitterHandles = twitterData?.handles ?? [];

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
            Latest updates, transfers, and social media buzz
          </p>
        </div>

        {/* ── Social Hub (Top, Full Width) ── */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1DA1F2' }} /> Social Hub
          </h2>

          {twitterLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading latest tweets...</div>
          ) : twitterHandles.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No tweets available at the moment.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {twitterHandles.map((handleData) => (
                <TweetSlider key={handleData.screen_name} handleData={handleData} />
              ))}
            </div>
          )}
        </section>

        {/* ── Latest Stories ── */}
        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)' }} /> Latest Stories
          </h2>
          
          {newsLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading news...</div>
          ) : articles.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No news found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {articles.map((article) => (
                <a key={article.id} href={article.link} target="_blank" rel="noopener noreferrer" className="card hover-scale fade-in" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}>
                  {article.media_url && (
                    <div style={{ width: '100%', height: '180px', flexShrink: 0 }}>
                      <img src={article.media_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{article.source}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{article.published_date ? formatDate(article.published_date) : ''}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', lineHeight: 1.4 }}>{article.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{article.description}</p>
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                      Read article <ExternalLink size={14} />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        /* Hide scrollbar for tweet slider but keep functionality */
        .tweet-slider::-webkit-scrollbar {
          display: none;
        }
        .tweet-slider {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .nav-btn {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .nav-btn:hover {
          background: var(--color-border);
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
