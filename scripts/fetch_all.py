"""
fetch_all.py
Main ETL orchestrator for Red Devils Analytics.

Usage:
    python scripts/fetch_all.py          # Only fetches if data is stale (>23h old)
    python scripts/fetch_all.py --force  # Force re-fetch regardless of age

API budget (per day):
  football-data.org : ~3 requests
  API-Football      : ~15 requests (well within 100/day limit)
"""

import os
import sys
import json
import argparse
import time
from pathlib import Path
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

# Load .env from project root (two levels up from scripts/)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

import fetch_football_data
import fetch_api_football

# ── Config ────────────────────────────────────────────────────────────────────
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "data"
MAX_AGE_HOURS = 23  # Skip fetch if data is fresher than this

# Files that must ALL be present and fresh for us to skip
FOOTBALL_DATA_FILES = ["standings.json", "fixtures.json", "results.json", "squad.json"]
API_FOOTBALL_FILES = ["player_stats.json", "injuries.json"]


def is_fresh(filepath: Path, max_age_hours: int = MAX_AGE_HOURS) -> bool:
    """Return True if file exists and was modified less than max_age_hours ago."""
    if not filepath.exists():
        return False
    mtime = datetime.fromtimestamp(filepath.stat().st_mtime, tz=timezone.utc)
    age = datetime.now(timezone.utc) - mtime
    return age < timedelta(hours=max_age_hours)


def all_fresh(files: list[str]) -> bool:
    """Return True if every file in the list is fresh."""
    return all(is_fresh(OUTPUT_DIR / f) for f in files)


def write_last_updated():
    """Write a last_updated.json for the frontend to display."""
    data = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "files": {
            f: (OUTPUT_DIR / f).exists()
            for f in FOOTBALL_DATA_FILES + API_FOOTBALL_FILES
        },
    }
    with open(OUTPUT_DIR / "last_updated.json", "w") as fp:
        json.dump(data, fp, indent=2)
    print(f"  ✓ Saved last_updated.json")


def main():
    parser = argparse.ArgumentParser(description="Red Devils Analytics ETL")
    parser.add_argument("--force", action="store_true", help="Force re-fetch even if data is fresh")
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    fd_key = os.environ.get("FOOTBALL_DATA_API_KEY")
    af_key = os.environ.get("API_FOOTBALL_KEY")

    if not fd_key or not af_key:
        print("ERROR: API keys not found in environment or .env file.")
        print("  Expected: FOOTBALL_DATA_API_KEY and API_FOOTBALL_KEY")
        sys.exit(1)

    print("=" * 60)
    print("Red Devils Analytics — Daily ETL")
    print(f"Run time: {datetime.now(timezone.utc).isoformat()}")
    print(f"Force mode: {args.force}")
    print("=" * 60)

    # ── football-data.org ─────────────────────────────────────────────────────
    if args.force or not all_fresh(FOOTBALL_DATA_FILES):
        fetch_football_data.run(fd_key, OUTPUT_DIR)
    else:
        print("\n[football-data.org] All files fresh — skipping fetch.")

    # ── API-Football ──────────────────────────────────────────────────────────
    if args.force or not all_fresh(API_FOOTBALL_FILES):
        fetch_api_football.run(af_key, OUTPUT_DIR)
    else:
        print("\n[API-Football] All files fresh — skipping fetch.")

    # ── Finalize ──────────────────────────────────────────────────────────────
    write_last_updated()

    print("\n" + "=" * 60)
    print("ETL complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
