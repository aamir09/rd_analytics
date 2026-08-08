"""
fetch_api_football.py
Fetches from api-football.com (v3).
Man United team ID: 33
Season: dynamically determined (current year or previous if before June)
Endpoints used (Phase 1):
  - /players?team=33&season=YYYY  (paginated, ~2 pages = ~2 requests)
  - /injuries?team=33&season=YYYY
  - /fixtures?team=33&season=YYYY  (for lineups/scorers not in football-data)
Daily quota: 100 requests. We use ~15 max.
Rate limit: 5 req/min — we sleep 13s between calls to be safe.
"""

import os
import json
import time
import requests
from pathlib import Path
from datetime import datetime, timezone


BASE_URL = "https://v3.football.api-sports.io"
MAN_UTD_ID = 33
SLEEP_BETWEEN = 13  # seconds between calls (5 req/min = 12s, we pad to 13)
# API-Football free plan only has data up to season 2024
FREE_PLAN_MAX_SEASON = 2024


def get_headers(api_key: str) -> dict:
    return {
        "x-apisports-key": api_key,
    }


def save_json(data: dict | list, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    size = len(json.dumps(data))
    print(f"  ✓ Saved {path.name} ({size} bytes)")


def current_season() -> int:
    """Return current football season year (e.g. 2025 for 2025/26).
    Season starts in August, so: if month >= 8, use current year. Else use year - 1.
    Capped to FREE_PLAN_MAX_SEASON for the API-Football free tier.
    """
    now = datetime.now(timezone.utc)
    season = now.year if now.month >= 8 else now.year - 1
    return min(season, FREE_PLAN_MAX_SEASON)


def fetch_player_stats(api_key: str, output_dir: Path, season: int):
    """
    Fetch all Man United player statistics for the season.
    API-Football paginates at 20 players per page.
    Typical squad is ~25 outfield + GKs → 2 pages = 2 requests.
    """
    print(f"→ Fetching player stats for season {season}...")
    all_players = []
    page = 1
    total_pages = 1
    requests_used = 0

    while page <= total_pages:
        url = f"{BASE_URL}/players"
        params = {"team": MAN_UTD_ID, "season": season, "page": page}
        r = requests.get(url, headers=get_headers(api_key), params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
        requests_used += 1

        paging = data.get("paging", {})
        total_pages = paging.get("total", 1)
        players = data.get("response", [])

        for entry in players:
            player = entry.get("player", {})
            stats_list = entry.get("statistics", [])
            # Use first stat block (usually PL or primary competition)
            stats = stats_list[0] if stats_list else {}

            all_players.append({
                "id": player.get("id"),
                "name": player.get("name"),
                "firstname": player.get("firstname"),
                "lastname": player.get("lastname"),
                "age": player.get("age"),
                "nationality": player.get("nationality"),
                "height": player.get("height"),
                "weight": player.get("weight"),
                "photo": player.get("photo"),
                "position": stats.get("games", {}).get("position"),
                "number": stats.get("games", {}).get("number"),
                "statistics": [
                    {
                        "competition": {
                            "id": s.get("league", {}).get("id"),
                            "name": s.get("league", {}).get("name"),
                            "logo": s.get("league", {}).get("logo"),
                        },
                        "games": s.get("games", {}),
                        "goals": s.get("goals", {}),
                        "assists": s.get("goals", {}).get("assists"),
                        "shots": s.get("shots", {}),
                        "passes": s.get("passes", {}),
                        "tackles": s.get("tackles", {}),
                        "duels": s.get("duels", {}),
                        "dribbles": s.get("dribbles", {}),
                        "fouls": s.get("fouls", {}),
                        "cards": s.get("cards", {}),
                        "penalty": s.get("penalty", {}),
                    }
                    for s in stats_list
                ],
            })

        print(f"  Page {page}/{total_pages} — {len(players)} players fetched")
        page += 1
        if page <= total_pages:
            time.sleep(SLEEP_BETWEEN)

    save_json({
        "season": season,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "players": all_players,
    }, output_dir / "player_stats.json")

    print(f"  Total player stat requests used: {requests_used}")
    return requests_used


def fetch_injuries(api_key: str, output_dir: Path, season: int):
    """Fetch current injury list for Man United."""
    print(f"→ Fetching injuries for season {season}...")
    url = f"{BASE_URL}/injuries"
    params = {"team": MAN_UTD_ID, "season": season}
    r = requests.get(url, headers=get_headers(api_key), params=params, timeout=15)
    r.raise_for_status()
    data = r.json()

    injuries = []
    for entry in data.get("response", []):
        player = entry.get("player", {})
        team = entry.get("team", {})
        fixture = entry.get("fixture", {})
        injuries.append({
            "player": {
                "id": player.get("id"),
                "name": player.get("name"),
                "photo": player.get("photo"),
                "type": player.get("type"),
                "reason": player.get("reason"),
            },
            "fixture": {
                "id": fixture.get("id"),
                "date": fixture.get("date"),
                "timezone": fixture.get("timezone"),
            },
        })

    save_json({
        "season": season,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "injuries": injuries,
    }, output_dir / "injuries.json")


def run(api_key: str, output_dir: Path, force: bool = False):
    """Run all API-Football fetches."""
    print("\n[API-Football] Starting fetch...")
    season = current_season()
    total_requests = 0

    total_requests += fetch_player_stats(api_key, output_dir, season)
    time.sleep(SLEEP_BETWEEN)

    fetch_injuries(api_key, output_dir, season)
    total_requests += 1

    print(f"[API-Football] Done. Used ~{total_requests + 1} API requests.\n")
