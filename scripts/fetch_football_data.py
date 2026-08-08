"""
fetch_football_data.py
----------------------
Fetches from football-data.org (free tier).
Man United team ID: 66
Endpoints used:
  - /competitions/PL/standings         → standings.json (Premier League 2026/27)
  - /competitions/CL/standings         → standings_cl.json (UEFA Champions League 2026/27)
  - /teams/66/matches                  → fixtures.json + results.json
  - /teams/66                          → squad.json
Rate limit: 10 req/min on free tier (7s sleep between calls)
"""

import os
import json
import time
import requests
from pathlib import Path
from datetime import datetime, timezone

BASE_URL = "https://api.football-data.org/v4"
MAN_UTD_ID = 66
PL_CODE = "PL"
CL_CODE = "CL"


def get_headers(api_key: str) -> dict:
    return {"X-Auth-Token": api_key}


def save_json(data: dict | list, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  [OK] Saved {path.name} ({len(json.dumps(data))} bytes)")


def fetch_standings(api_key: str, output_dir: Path):
    """Fetch PL and CL standings."""
    # 1. Premier League standings
    print(">> Fetching PL standings...")
    url_pl = f"{BASE_URL}/competitions/{PL_CODE}/standings"
    r_pl = requests.get(url_pl, headers=get_headers(api_key), timeout=15)
    r_pl.raise_for_status()
    data_pl = r_pl.json()

    table_pl = []
    for entry in data_pl.get("standings", [{}])[0].get("table", []):
        team = entry.get("team", {})
        table_pl.append({
            "position": entry.get("position"),
            "team": {
                "id": team.get("id"),
                "name": team.get("name"),
                "shortName": team.get("shortName"),
                "tla": team.get("tla"),
                "crest": team.get("crest"),
            },
            "playedGames": entry.get("playedGames"),
            "won": entry.get("won"),
            "draw": entry.get("draw"),
            "lost": entry.get("lost"),
            "points": entry.get("points"),
            "goalsFor": entry.get("goalsFor"),
            "goalsAgainst": entry.get("goalsAgainst"),
            "goalDifference": entry.get("goalDifference"),
            "form": entry.get("form"),
        })

    season_str = data_pl.get("season", {}).get("startDate", "")[:4] or "2026"
    save_json({
        "season": season_str,
        "competition": "Premier League",
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "table": table_pl,
    }, output_dir / "standings.json")

    time.sleep(7)

    # 2. UEFA Champions League standings
    print(">> Fetching CL standings...")
    url_cl = f"{BASE_URL}/competitions/{CL_CODE}/standings"
    try:
        r_cl = requests.get(url_cl, headers=get_headers(api_key), timeout=15)
        if r_cl.status_code == 200:
            data_cl = r_cl.json()
            table_cl = []
            standings_groups = data_cl.get("standings", [])
            if standings_groups:
                for entry in standings_groups[0].get("table", []):
                    team = entry.get("team", {})
                    table_cl.append({
                        "position": entry.get("position"),
                        "team": {
                            "id": team.get("id"),
                            "name": team.get("name"),
                            "shortName": team.get("shortName"),
                            "tla": team.get("tla"),
                            "crest": team.get("crest"),
                        },
                        "playedGames": entry.get("playedGames"),
                        "won": entry.get("won"),
                        "draw": entry.get("draw"),
                        "lost": entry.get("lost"),
                        "points": entry.get("points"),
                        "goalsFor": entry.get("goalsFor"),
                        "goalsAgainst": entry.get("goalsAgainst"),
                        "goalDifference": entry.get("goalDifference"),
                        "form": entry.get("form"),
                    })

            cl_season = data_cl.get("season", {}).get("startDate", "")[:4] or "2026"
            save_json({
                "season": cl_season,
                "competition": "UEFA Champions League",
                "stage": "League Phase",
                "fetchedAt": datetime.now(timezone.utc).isoformat(),
                "table": table_cl,
            }, output_dir / "standings_cl.json")
        else:
            print(f"  [WARN] CL standings returned status {r_cl.status_code}")
    except Exception as e:
        print(f"  [WARN] Failed to fetch CL standings: {e}")


def fetch_matches(api_key: str, output_dir: Path):
    """Fetch all matches for Man United across all tracked competitions."""
    print(">> Fetching Man United matches...")
    url = f"{BASE_URL}/teams/{MAN_UTD_ID}/matches"
    params = {"limit": 100}
    r = requests.get(url, headers=get_headers(api_key), params=params, timeout=15)
    r.raise_for_status()
    data = r.json()

    now = datetime.now(timezone.utc)
    fixtures = []
    results = []

    for m in data.get("matches", []):
        utc_date = m.get("utcDate", "")
        match_dt = datetime.fromisoformat(utc_date.replace("Z", "+00:00")) if utc_date else None

        match_obj = {
            "id": m.get("id"),
            "utcDate": utc_date,
            "status": m.get("status"),
            "matchday": m.get("matchday"),
            "stage": m.get("stage"),
            "competition": {
                "id": m.get("competition", {}).get("id"),
                "name": m.get("competition", {}).get("name"),
                "code": m.get("competition", {}).get("code"),
                "emblem": m.get("competition", {}).get("emblem"),
            },
            "homeTeam": {
                "id": m.get("homeTeam", {}).get("id"),
                "name": m.get("homeTeam", {}).get("name"),
                "shortName": m.get("homeTeam", {}).get("shortName"),
                "tla": m.get("homeTeam", {}).get("tla"),
                "crest": m.get("homeTeam", {}).get("crest"),
            },
            "awayTeam": {
                "id": m.get("awayTeam", {}).get("id"),
                "name": m.get("awayTeam", {}).get("name"),
                "shortName": m.get("awayTeam", {}).get("shortName"),
                "tla": m.get("awayTeam", {}).get("tla"),
                "crest": m.get("awayTeam", {}).get("crest"),
            },
            "score": m.get("score", {}),
            "referees": [r.get("name") for r in m.get("referees", [])],
        }

        if match_dt and match_dt > now:
            fixtures.append(match_obj)
        elif m.get("status") in ("FINISHED", "IN_PLAY", "PAUSED"):
            results.append(match_obj)

    fixtures.sort(key=lambda x: x["utcDate"])
    results.sort(key=lambda x: x["utcDate"], reverse=True)

    meta = {"fetchedAt": now.isoformat(), "teamId": MAN_UTD_ID}
    save_json({**meta, "matches": fixtures}, output_dir / "fixtures.json")
    save_json({**meta, "matches": results}, output_dir / "results.json")


def fetch_squad(api_key: str, output_dir: Path):
    """Fetch Man United squad."""
    print(">> Fetching Man United squad...")
    url = f"{BASE_URL}/teams/{MAN_UTD_ID}"
    r = requests.get(url, headers=get_headers(api_key), timeout=15)
    r.raise_for_status()
    data = r.json()

    squad = []
    for p in data.get("squad", []):
        squad.append({
            "id": p.get("id"),
            "name": p.get("name"),
            "position": p.get("position"),
            "dateOfBirth": p.get("dateOfBirth"),
            "nationality": p.get("nationality"),
            "shirtNumber": p.get("shirtNumber"),
        })

    team_info = {
        "id": data.get("id"),
        "name": data.get("name"),
        "shortName": data.get("shortName"),
        "tla": data.get("tla"),
        "crest": data.get("crest"),
        "address": data.get("address"),
        "website": data.get("website"),
        "founded": data.get("founded"),
        "clubColors": data.get("clubColors"),
        "venue": data.get("venue"),
        "coach": data.get("coach", {}),
    }

    save_json({
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "team": team_info,
        "squad": squad,
    }, output_dir / "squad.json")


def run(api_key: str, output_dir: Path, force: bool = False):
    """Run all football-data.org fetches."""
    print("\n[football-data.org] Starting fetch...")

    fetch_standings(api_key, output_dir)
    time.sleep(7)

    fetch_matches(api_key, output_dir)
    time.sleep(7)

    fetch_squad(api_key, output_dir)

    print("[football-data.org] Done. Used 4 API requests.\n")
