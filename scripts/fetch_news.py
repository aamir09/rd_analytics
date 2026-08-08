"""
fetch_news.py
Fetches latest Manchester United news using NewsMesh API.
Filters out edge cases (e.g., Man City news accidentally caught in search).
Saves to public/data/news.json.
"""

import os
import json
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

try:
    from newsmesh import NewsMeshClient
except ImportError:
    print("WARNING: newsmesh not installed. Run `pip install newsmesh[async]`")
    NewsMeshClient = None

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "data"

def is_man_city_edge_case(title: str, desc: str) -> bool:
    """
    Returns True if the article is only about Man City and not Man United.
    """
    text = f"{title} {desc}".lower()
    
    has_city = "man city" in text or "manchester city" in text
    has_united = "man united" in text or "manchester united" in text or "mufc" in text
    
    if has_city and not has_united:
        return True
    return False

def run():
    api_key = os.environ.get("NEWSMESH_API_KEY", "nm_d0Hhyzxl_tOt41cwOD1KHkA29leBvN-Vy1ZpvnGDoZY")
    if not NewsMeshClient:
        return
        
    client = NewsMeshClient(api_key)
    
    # Format current date as dd/mm/yyyy
    current_date = datetime.now(timezone.utc).strftime("%d/%m/%Y")
    
    print(f">> Fetching news up to {current_date}...")
    
    try:
        results = client.search(
            query="Manchester United", 
            to_date=current_date, 
            sort_by=["date_descending"]
        )
    except Exception as e:
        print(f"Error fetching news: {e}")
        return

    articles_data = []
    
    if hasattr(results, 'data'):
        articles = results.data
    else:
        articles = results

    for article in articles:
        # Check category
        if getattr(article, 'category', '').lower() != 'sports':
            continue
            
        title = getattr(article, 'title', '') or ''
        desc = getattr(article, 'description', '') or ''
        
        # Filter out edge cases (Man City only)
        if is_man_city_edge_case(title, desc):
            print(f"  [SKIP] Man City edge case: {title}")
            continue
            
        articles_data.append({
            "id": getattr(article, 'article_id', ''),
            "title": title,
            "description": desc,
            "link": getattr(article, 'link', ''),
            "published_date": getattr(article, 'published_date', ''),
            "source": getattr(article, 'source', ''),
            "media_url": getattr(article, 'media_url', ''),
            "topics": getattr(article, 'topics', []),
        })

    # Sort by published date descending just in case
    articles_data.sort(key=lambda x: x.get('published_date', ''), reverse=True)
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / "news.json"
    
    output = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "articles": articles_data
    }
    
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
        
    print(f"  [OK] Saved {out_path.name} ({len(articles_data)} articles)")

if __name__ == "__main__":
    run()
