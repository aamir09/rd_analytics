"""
fetch_twitter.py
Fetches latest 5 tweets for specified handles using twitter-api45 via RapidAPI.
Saves to public/data/twitter.json.
"""

import os
import json
import re
import http.client
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "data"
HANDLES = ["mufcMPB", "FabrizioRomano", "indykaila", "David_Ornstein"]

def parse_twitter_date(date_str: str) -> datetime:
    # Example: "Sat Aug 08 15:35:42 +0000 2026"
    try:
        return datetime.strptime(date_str, "%a %b %d %H:%M:%S %z %Y")
    except Exception:
        # Fallback to current time if parsing fails
        return datetime.now(timezone.utc)

def is_man_utd_related(text: str) -> bool:
    text_lower = text.lower()
    keywords = ["manchester united", "man united", "man utd", "mufc", "manutd"]
    for kw in keywords:
        if kw in text_lower:
            return True
    # Check 'united' separately but ignore other 'United' teams
    if re.search(r'\bunited\b', text_lower):
        other_uniteds = [
            "newcastle united", "west ham united", "sheffield united", 
            "leeds united", "rotherham united", "carlisle united", 
            "peterborough united", "oxford united", "cambridge united", 
            "southend united", "torquay united", "ayr united", "dundee united",
            "atlanta united", "dc united", "minnesota united", "new mexico united"
        ]
        test_text = text_lower
        for ou in other_uniteds:
            test_text = test_text.replace(ou, "")
            
        if re.search(r'\bunited\b', test_text):
            return True
            
    return False

def fetch_timeline(handle: str, api_key: str):
    conn = http.client.HTTPSConnection("twitter-api45.p.rapidapi.com")
    headers = {
        'x-rapidapi-key': api_key,
        'x-rapidapi-host': "twitter-api45.p.rapidapi.com",
        'Content-Type': "application/json"
    }

    try:
        conn.request("GET", f"/timeline.php?screenname={handle}", headers=headers)
        res = conn.getresponse()
        data = res.read()
        return json.loads(data.decode("utf-8"))
    except Exception as e:
        print(f"Error fetching {handle}: {e}")
        return None

def run():
    api_key = os.environ.get("RAPID_API_KEY")
    if not api_key:
        print("ERROR: RAPID_API_KEY not found in environment variables.")
        return

    output_data = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "handles": []
    }

    print(">> Fetching Twitter data via RapidAPI...")

    for handle in HANDLES:
        print(f"  Fetching @{handle}...")
        raw_data = fetch_timeline(handle, api_key)
        if not raw_data or 'timeline' not in raw_data:
            print(f"  [WARNING] Invalid data for @{handle}")
            continue
            
        timeline = raw_data['timeline']
        
        # Filter if handle is not mufcMPB
        if handle != "mufcMPB":
            timeline = [t for t in timeline if is_man_utd_related(t.get('text', ''))]
        
        # Parse and sort
        for t in timeline:
            t['_parsed_date'] = parse_twitter_date(t.get('created_at', ''))

        # Sort by date descending
        timeline.sort(key=lambda x: x['_parsed_date'], reverse=True)
        
        # Take top 5
        top_5 = timeline[:5]
        
        # Normalize fields for frontend to keep JSON size small
        normalized_tweets = []
        for t in top_5:
            # Extract image if exists
            image_url = None
            if 'media' in t and 'photo' in t['media'] and len(t['media']['photo']) > 0:
                image_url = t['media']['photo'][0].get('media_url_https')
            
            author = t.get('author', {})
            
            normalized_tweets.append({
                "id": t.get('tweet_id'),
                "created_at": t['_parsed_date'].isoformat(),
                "text": t.get('text', ''),
                "views": t.get('views'),
                "favorites": t.get('favorites'),
                "retweets": t.get('retweets'),
                "media_url": image_url,
                "author": {
                    "name": author.get('name'),
                    "screen_name": author.get('screen_name'),
                    "avatar": author.get('avatar')
                }
            })

        output_data["handles"].append({
            "screen_name": handle,
            "tweets": normalized_tweets
        })
        print(f"  [OK] Processed 5 tweets for @{handle}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / "twitter.json"
    
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
        
    print(f">> Saved to {out_path.name}")

if __name__ == "__main__":
    run()
