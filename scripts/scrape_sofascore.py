"""
scrape_sofascore.py
Scrapes all EPL player statistics from SofaScore for a given season.
Outputs a stripped JSON file to public/data/sofascore/<season>_player_stats.json.

Usage:
    python scripts/scrape_sofascore.py --season 2627
"""

import asyncio
import argparse
import json
import random
from pathlib import Path
from playwright.async_api import async_playwright


# ============================================================
# CONFIG
# ============================================================

TOURNAMENT_ID = 17  # Premier League

API_BASE = "https://www.sofascore.com/api/v1"
BASE_URL = "https://www.sofascore.com"

SCRIPT_DIR = Path(__file__).parent.parent
OUTPUT_DIR = SCRIPT_DIR / "public" / "data" / "sofascore"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

SEASON_MAP = {
    "2526": {"search": ["25/26", "2025/2026"], "year": "2025/26"},
    "2627": {"search": ["26/27", "2026/2027"], "year": "2026/27"},
}


# ============================================================
# DELAY
# ============================================================

async def polite_delay():
    await asyncio.sleep(random.uniform(1.0, 2.5))


# ============================================================
# BROWSER API REQUEST
# ============================================================

async def api_get(page, endpoint):
    url = f"{API_BASE}{endpoint}"

    for attempt in range(3):
        try:
            result = await page.evaluate(
                """
                async (url) => {
                    const response = await fetch(url, {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            "Accept": "application/json",
                            "X-Requested-With": "XMLHttpRequest"
                        }
                    });
                    return {
                        status: response.status,
                        text: await response.text()
                    };
                }
                """,
                url
            )

            status = result["status"]

            if status == 200:
                try:
                    return json.loads(result["text"])
                except json.JSONDecodeError:
                    print(f"Invalid JSON: {url}")
                    return None

            elif status == 429:
                wait = 10 * (attempt + 1)
                print(f"Rate limited. Waiting {wait}s...")
                await asyncio.sleep(wait)

            elif status in (500, 502, 503, 504):
                wait = 3 * (attempt + 1)
                print(f"Server error {status}. Waiting {wait}s...")
                await asyncio.sleep(wait)

            else:
                print(f"HTTP {status}: {url}")
                await asyncio.sleep(2 * (attempt + 1))

        except Exception as e:
            print(f"Request error: {e}")
            await asyncio.sleep(2 * (attempt + 1))

    return None


# ============================================================
# FIND SEASON
# ============================================================

async def find_season(page, season_key):
    cfg = SEASON_MAP[season_key]
    data = await api_get(page, f"/unique-tournament/{TOURNAMENT_ID}/seasons")

    if not data:
        raise RuntimeError("Could not retrieve Premier League seasons.")

    seasons = data.get("seasons", [])
    print(f"\nAvailable seasons (top 5):")
    for s in seasons[:5]:
        print(f"  {s.get('name')} | {s.get('year')} | ID: {s.get('id')}")

    for s in seasons:
        name = str(s.get("name", "")).lower()
        year = str(s.get("year", "")).lower()

        for search_term in cfg["search"]:
            if search_term in name or search_term == year:
                print(f"\nFound season: {s}")
                return s["id"]

    raise RuntimeError(f"Could not find {cfg['year']} season on SofaScore.")


# ============================================================
# GET TEAMS
# ============================================================

async def get_teams(page, season_id):
    endpoint = f"/unique-tournament/{TOURNAMENT_ID}/season/{season_id}/standings/total"
    data = await api_get(page, endpoint)

    if not data:
        raise RuntimeError("Could not retrieve standings.")

    teams = {}
    for standing in data.get("standings", []):
        for row in standing.get("rows", []):
            team = row.get("team")
            if not team:
                continue
            teams[team["id"]] = {
                "team_id": team["id"],
                "team_name": team.get("name"),
                "team_slug": team.get("slug"),
                "team_code": team.get("nameCode"),
            }

    teams = list(teams.values())
    print(f"\nFound {len(teams)} teams.")
    return teams


# ============================================================
# GET TEAM PLAYERS
# ============================================================

async def get_team_players(page, team):
    data = await api_get(page, f"/team/{team['team_id']}/players")
    if not data:
        return []

    players = []
    for item in data.get("players", []):
        player = item.get("player")
        if not player:
            continue

        players.append({
            "player_id": player.get("id"),
            "player_name": player.get("name"),
            "position": player.get("position"),
            "jersey_number": str(player.get("jerseyNumber", "")),
            "team_id": team["team_id"],
            "team_name": team["team_name"],
            "team_code": team["team_code"],
        })

    return players


# ============================================================
# GET PLAYER SEASON STATS
# ============================================================

async def get_player_stats(page, player_id, season_id):
    endpoint = (
        f"/player/{player_id}"
        f"/unique-tournament/{TOURNAMENT_ID}"
        f"/season/{season_id}"
        f"/statistics/overall"
    )
    return await api_get(page, endpoint)


# ============================================================
# SCRAPER MAIN
# ============================================================

async def scrape(season_key):
    raw_dir = OUTPUT_DIR / f"raw_{season_key}"
    raw_dir.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as p:
        print("\nLaunching browser...")
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="en-US"
        )
        page = await context.new_page()

        print("Opening SofaScore...")
        await page.goto(BASE_URL, wait_until="domcontentloaded", timeout=60000)

        # Find season
        season_id = await find_season(page, season_key)
        print(f"\nUsing season ID: {season_id}")

        # Teams
        teams = await get_teams(page, season_id)

        # Collect all players
        all_players = {}
        print("\nCollecting players...")

        for idx, team in enumerate(teams, 1):
            print(f"\n[{idx}/{len(teams)}] {team['team_name']}")
            team_players = await get_team_players(page, team)
            print(f"  Players: {len(team_players)}")

            for player in team_players:
                pid = str(player["player_id"])
                if pid not in all_players:
                    all_players[pid] = player

            await polite_delay()

        print(f"\nUnique players: {len(all_players)}")

        # Fetch stats for each player
        completed = 0
        for pid, player in all_players.items():
            raw_path = raw_dir / f"{pid}.json"

            # Resume support
            if raw_path.exists():
                completed += 1
                continue

            print(f"[{completed + 1}/{len(all_players)}] {player['player_name']} ({player['team_name']})")

            stats = await get_player_stats(page, int(pid), season_id)

            with open(raw_path, "w", encoding="utf-8") as f:
                json.dump({
                    "player": player,
                    "statistics": stats,
                }, f, ensure_ascii=False, indent=2)

            completed += 1
            await polite_delay()

        await browser.close()

    return raw_dir, all_players


# ============================================================
# BUILD FINAL DATASET
# ============================================================

def build_final_dataset(season_key, raw_dir):
    files = sorted(raw_dir.glob("*.json"))
    print(f"\nBuilding final dataset from {len(files)} players...")

    stripped = []
    for file in files:
        with open(file, "r", encoding="utf-8") as f:
            data = json.load(f)

        player = data.get("player", {})
        stats_data = data.get("statistics")

        if not stats_data or not isinstance(stats_data, dict):
            continue

        # The API returns stats nested under a 'statistics' key sometimes
        stats = stats_data.get("statistics") if "statistics" in stats_data else stats_data

        if not isinstance(stats, dict):
            continue

        mp = stats.get("minutesPlayed", 0)
        if not mp or mp <= 0:
            continue

        # Keep only numeric stat values
        clean_stats = {k: v for k, v in stats.items() if isinstance(v, (int, float)) or v is None}

        stripped.append({
            "player_id": player.get("player_id"),
            "player_name": player.get("player_name"),
            "team_name": player.get("team_name"),
            "team_code": player.get("team_code"),
            "position": player.get("position"),
            "jersey_number": player.get("jersey_number"),
            "statistics": clean_stats,
        })

    out_path = OUTPUT_DIR / f"{season_key}_player_stats.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(stripped, f, ensure_ascii=False)

    print(f"\nFinal: {len(stripped)} players with stats")
    print(f"Saved: {out_path} ({out_path.stat().st_size / 1024:.0f} KB)")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape SofaScore EPL player stats")
    parser.add_argument("--season", required=True, choices=["2526", "2627"],
                        help="Season to scrape (2526 or 2627)")
    args = parser.parse_args()

    raw_dir, _ = asyncio.run(scrape(args.season))
    build_final_dataset(args.season, raw_dir)

    print("\nDONE.")
