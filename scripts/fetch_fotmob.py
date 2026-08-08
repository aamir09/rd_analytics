"""
fetch_fotmob.py
---------------
Scrapes all 37 Man United player stat categories from FotMob using Playwright.
Saves individual stat JSONs to public/data/fotmob/ then calls merge_fotmob.py
to produce public/data/player_stats_fotmob.json.

Usage:
    python scripts/fetch_fotmob.py

GitHub Actions: runs headless chromium, no API keys required.
Season/team constants are defined below — update SEASON_ID when FotMob changes season.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

try:
    from playwright.async_api import async_playwright
except ImportError:
    raise SystemExit("Missing dependency: pip install playwright && playwright install chromium --with-deps")

# ── Constants ─────────────────────────────────────────────────────────────────
ROOT       = Path(__file__).parent.parent
OUTPUT_DIR = ROOT / "public" / "data" / "fotmob"

FOTMOB_LEAGUE  = 47       # Premier League
FOTMOB_SEASON  = 27110    # 2025/26 season ID
FOTMOB_TEAM    = 10260    # Manchester United

# All 37 stat categories with their FotMob URL slug
STAT_SLUGS = {
    "Topscorer":                    "goals",
    "Assists":                      "goal_assist",
    "Goals+Assists":                "_goals_and_goal_assist",
    "FotMobrating":                 "rating",
    "Minutesplayed":                "mins_played",
    "Goalsper90":                   "goals_per_90",
    "Expectedgoals(xG)":            "expected_goals",
    "xGper90":                      "expected_goals_per_90",
    "Expectedgoalsontarget(xGOT)":  "expected_goalsontarget",
    "Shotsontargetper90":           "ontarget_scoring_att",
    "Shotsper90":                   "total_scoring_att",
    "Accuratepassesper90":          "accurate_pass",
    "Bigchancescreated":            "big_chance_created",
    "Chancescreated":               "total_att_assist",
    "Accuratelongballsper90":       "accurate_long_balls",
    "Expectedassists(xA)":          "expected_assists",
    "xAper90":                      "expected_assists_per_90",
    "xG+xAper90":                   "_expected_goals_and_expected_assists_per_90",
    "Successfuldribblesper90":      "won_contest",
    "Bigchancesmissed":             "big_chance_missed",
    "Penaltiesawarded":             "penalty_won",
    "Defensivecontributionsper90":  "defensive_contributions",
    "Tacklesper90":                 "total_tackle",
    "Interceptionsper90":           "interception",
    "Clearancesper90":              "effective_clearance",
    "Blocksper90":                  "outfielder_block",
    "Recoveriesper90":              "ball_recovery",
    "Penaltiesconceded":            "penalty_conceded",
    "Possessionwonfinal3rdper90":   "poss_won_att_3rd",
    "Cleansheets":                  "clean_sheet",
    "Savepercentage":               "_save_percentage",
    "Savesper90":                   "saves",
    "Goalsprevented":               "_goals_prevented",
    "Goalsconcededper90":           "goals_conceded",
    "Foulscommittedper90":          "fouls",
    "Yellowcards":                  "yellow_card",
    "Redcards":                     "red_card",
}

BASE_URL = (
    f"https://www.fotmob.com/leagues/{FOTMOB_LEAGUE}/stats"
    f"/season/{FOTMOB_SEASON}/players/{{slug}}/team/{FOTMOB_TEAM}"
)


async def extract_stat(page, url: str, filename: str) -> dict | None:
    """Navigate to a FotMob stat page and extract player data."""
    print(f"  >> {url}")
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(1500)  # allow JS hydration

        # Method 1: __NEXT_DATA__ JSON
        next_script = await page.query_selector("script#__NEXT_DATA__")
        if next_script:
            raw = await next_script.inner_text()
            json_data = json.loads(raw)
            page_props = json_data.get("props", {}).get("pageProps", {})
            stats_list = page_props.get("data", {}).get("statsData", [])

            if stats_list:
                rows = []
                for player in stats_list:
                    rows.append({
                        "rank":      player.get("rank"),
                        "name":      player.get("name"),
                        "primary":   (player.get("statValue") or {}).get("value"),
                        "secondary": (player.get("substatValue") or {}).get("value"),
                    })
                return {"source": "nextdata", "rows": rows}

        # Method 2: DOM fallback
        await page.wait_for_selector("ol.divide-y li", timeout=10000)
        rows_els = await page.query_selector_all("ol.divide-y li")
        rows = []
        for el in rows_els:
            rank_el  = await el.query_selector("span.w-5")
            name_el  = await el.query_selector("p")
            stat_el  = await el.query_selector("span.font-medium")
            if rank_el and name_el and stat_el:
                rows.append({
                    "rank":      (await rank_el.inner_text()).strip(),
                    "name":      (await name_el.inner_text()).strip(),
                    "primary":   (await stat_el.inner_text()).strip(),
                    "secondary": None,
                })
        return {"source": "dom", "rows": rows}

    except Exception as e:
        print(f"  [WARN] Failed {filename}: {e}")
        return None


def rows_to_pandas_orient(rows: list[dict]) -> dict:
    """Convert list of row dicts to pandas-style columnar JSON (matching existing format)."""
    result = {
        "Rank":               {},
        "Player Name":        {},
        "Assists":            {},   # reused as primary value column
        "Expected Assists":   {},   # reused as secondary value column
    }
    for i, row in enumerate(rows):
        s = str(i)
        result["Rank"][s]             = row.get("rank")
        result["Player Name"][s]      = row.get("name")
        result["Assists"][s]          = row.get("primary")
        result["Expected Assists"][s] = row.get("secondary")
    return result


async def scrape_all() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    total = len(STAT_SLUGS)
    success = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        )
        page = await browser.new_page()

        # Set a realistic user-agent to reduce bot detection
        await page.set_extra_http_headers({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            )
        })

        for filename, slug in STAT_SLUGS.items():
            url = BASE_URL.format(slug=slug)
            result = await extract_stat(page, url, filename)

            if result and result.get("rows"):
                data = rows_to_pandas_orient(result["rows"])
                out_path = OUTPUT_DIR / f"{filename}.json"
                with open(out_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False)
                print(f"  [OK] Saved {filename}.json ({len(result['rows'])} players)")
                success += 1
            else:
                print(f"  [SKIP] No data for {filename}")

            # Small polite delay between pages
            await page.wait_for_timeout(800)

        await browser.close()

    print(f"\n[DONE] Scraped {success}/{total} stat categories")


def main() -> None:
    print("=" * 60)
    print("FotMob Playwright Scraper")
    print(f"League: {FOTMOB_LEAGUE} | Season: {FOTMOB_SEASON} | Team: {FOTMOB_TEAM}")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 60)

    asyncio.run(scrape_all())

    # After scraping, run the merge
    print("\n[NEXT] Running merge_fotmob.py...")
    merge_script = Path(__file__).parent / "merge_fotmob.py"
    os.system(f"{sys.executable} {merge_script}")


if __name__ == "__main__":
    main()
