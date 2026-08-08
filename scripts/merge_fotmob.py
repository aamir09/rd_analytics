"""
merge_fotmob.py
---------------
Reads all per-stat JSON files from data/fotmob/ (scraped from FotMob via Playwright),
reads the label mapping from scripts/fotmob_stats_template.xlsx, and merges everything
into a single public/data/player_stats_fotmob.json keyed per player by normalised name.

Run:
    python scripts/merge_fotmob.py
"""

import json
import os
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

try:
    import openpyxl
except ImportError:
    raise SystemExit("Missing dependency: pip install openpyxl")

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT        = Path(__file__).parent.parent
DATA_DIR    = ROOT / "public" / "data" / "fotmob"
EXCEL_PATH  = Path(__file__).parent / "fotmob_stats_template.xlsx"
OUTPUT_PATH = ROOT / "public" / "data" / "player_stats_fotmob.json"

# ── Filename → stat key mapping ───────────────────────────────────────────────
# Maps the stat category name (from Excel col A) to the filename stem in data/fotmob/
STAT_FILE_MAP = {
    "Top scorer":                      "Topscorer",
    "Assists":                         "Assists",
    "Goals + Assists":                 "Goals+Assists",
    "FotMob rating":                   "FotMobrating",
    "Minutes played":                  "Minutesplayed",
    "Goals per 90":                    "Goalsper90",
    "Expected goals (xG)":             "Expectedgoals(xG)",
    "xG per 90":                       "xGper90",
    "Expected goals on target (xGOT)": "Expectedgoalsontarget(xGOT)",
    "Shots on target per 90":          "Shotsontargetper90",
    "Shots per 90":                    "Shotsper90",
    "Accurate passes per 90":          "Accuratepassesper90",
    "Big chances created":             "Bigchancescreated",
    "Chances created":                 "Chancescreated",
    "Accurate long balls per 90":      "Accuratelongballsper90",
    "Expected assists (xA)":           "Expectedassists(xA)",
    "xA per 90":                       "xAper90",
    "xG + xA per 90":                  "xG+xAper90",
    "Successful dribbles per 90":      "Successfuldribblesper90",
    "Big chances missed":              "Bigchancesmissed",
    "Penalties awarded":               "Penaltiesawarded",
    "Defensive contributions per 90":  "Defensivecontributionsper90",
    "Tackles per 90":                  "Tacklesper90",
    "Interceptions per 90":            "Interceptionsper90",
    "Clearances per 90":               "Clearancesper90",
    "Blocks per 90":                   "Blocksper90",
    "Recoveries per 90":               "Recoveriesper90",
    "Penalties conceded":              "Penaltiesconceded",
    "Possession won final 3rd per 90": "Possessionwonfinal3rdper90",
    "Clean sheets":                    "Cleansheets",
    "Save percentage":                 "Savepercentage",
    "Saves per 90":                    "Savesper90",
    "Goals prevented":                 "Goalsprevented",
    "Goals conceded per 90":           "Goalsconcededper90",
    "Fouls committed per 90":          "Foulscommittedper90",
    "Yellow cards":                    "Yellowcards",
    "Red cards":                       "Redcards",
}

# Camel-case key for each stat category (used as JSON key in output)
STAT_KEY_MAP = {
    "Top scorer":                      "goals",
    "Assists":                         "assists",
    "Goals + Assists":                 "goalsAndAssists",
    "FotMob rating":                   "rating",
    "Minutes played":                  "minutesPlayed",
    "Goals per 90":                    "goalsPer90",
    "Expected goals (xG)":             "xG",
    "xG per 90":                       "xGPer90",
    "Expected goals on target (xGOT)": "xGOT",
    "Shots on target per 90":          "shotsOnTargetPer90",
    "Shots per 90":                    "shotsPer90",
    "Accurate passes per 90":          "accuratePassesPer90",
    "Big chances created":             "bigChancesCreated",
    "Chances created":                 "chancesCreated",
    "Accurate long balls per 90":      "accurateLongBallsPer90",
    "Expected assists (xA)":           "xA",
    "xA per 90":                       "xAPer90",
    "xG + xA per 90":                  "xGAndXAPer90",
    "Successful dribbles per 90":      "successfulDribblesPer90",
    "Big chances missed":              "bigChancesMissed",
    "Penalties awarded":               "penaltiesAwarded",
    "Defensive contributions per 90":  "defensiveContributionsPer90",
    "Tackles per 90":                  "tacklesPer90",
    "Interceptions per 90":            "interceptionsPer90",
    "Clearances per 90":               "clearancesPer90",
    "Blocks per 90":                   "blocksPer90",
    "Recoveries per 90":               "recoveriesPer90",
    "Penalties conceded":              "penaltiesConceded",
    "Possession won final 3rd per 90": "possWonFinal3rdPer90",
    "Clean sheets":                    "cleanSheets",
    "Save percentage":                 "savePercentage",
    "Saves per 90":                    "savesPer90",
    "Goals prevented":                 "goalsPrevented",
    "Goals conceded per 90":           "goalsConcededPer90",
    "Fouls committed per 90":          "foulsCommittedPer90",
    "Yellow cards":                    "yellowCards",
    "Red cards":                       "redCards",
}


def norm_name(name: str) -> str:
    """Normalise a player name for matching: lowercase, strip, collapse spaces,
    remove diacritics so 'Lisandro Martínez' == 'lisandro martinez'."""
    nfkd = unicodedata.normalize("NFKD", name)
    ascii_name = nfkd.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", ascii_name).strip().lower()


def load_excel_labels(path: Path) -> dict[str, dict]:
    """Returns {stat_category: {primaryLabel, secondaryLabel}}"""
    wb = openpyxl.load_workbook(path)
    ws = wb.active
    labels = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        if row[0]:
            labels[row[0]] = {
                "primaryLabel":   (row[1] or "").strip(),
                "secondaryLabel": (row[2] or "").strip(),
            }
    return labels


def load_stat_file(stat_category: str) -> list[dict]:
    """Load a single stat JSON, return list of {name, primary, secondary}."""
    filename = STAT_FILE_MAP.get(stat_category)
    if not filename:
        return []
    path = DATA_DIR / f"{filename}.json"
    if not path.exists():
        print(f"  [WARN] Missing file: {path.name}")
        return []

    with open(path, encoding="utf-8") as f:
        raw = json.load(f)

    # pandas columnar format: {col: {index: value}}
    columns = list(raw.keys())
    # Find the player name column
    name_col = next((c for c in columns if "player" in c.lower() or "name" in c.lower()), None)
    if not name_col:
        print(f"  [WARN] No name column in {path.name}, columns: {columns}")
        return []

    # Primary stat = 3rd column (index 2), Secondary = 4th column (index 3)
    stat_cols = [c for c in columns if c not in ("Rank", name_col)]
    primary_col   = stat_cols[0] if len(stat_cols) > 0 else None
    secondary_col = stat_cols[1] if len(stat_cols) > 1 else None

    names = raw[name_col]
    primaries  = raw.get(primary_col, {})   if primary_col   else {}
    secondaries = raw.get(secondary_col, {}) if secondary_col else {}

    rows = []
    for idx in names:
        rows.append({
            "name":      names[idx],
            "primary":   primaries.get(idx),
            "secondary": secondaries.get(idx),
        })
    return rows


def merge() -> None:
    print("=" * 60)
    print("FotMob Data Merge")
    print(f"Source: {DATA_DIR}")
    print(f"Output: {OUTPUT_PATH}")
    print("=" * 60)

    # Load label mapping from Excel
    labels = load_excel_labels(EXCEL_PATH)
    print(f"[OK] Loaded {len(labels)} stat labels from Excel template")

    # Build per-player dict keyed by normalised name
    # Structure: {norm_name: {displayName, stats: {statKey: {...}}}}
    players: dict[str, dict] = {}

    for stat_category, json_key in STAT_KEY_MAP.items():
        label_info = labels.get(stat_category, {"primaryLabel": stat_category, "secondaryLabel": ""})
        rows = load_stat_file(stat_category)
        if not rows:
            print(f"  [SKIP] {stat_category}")
            continue

        print(f"  [OK]   {stat_category} — {len(rows)} players")
        for row in rows:
            raw_name = row["name"]
            key = norm_name(raw_name)
            if key not in players:
                players[key] = {"name": raw_name, "stats": {}}
            # Keep the most complete display name (prefer longer)
            if len(raw_name) > len(players[key]["name"]):
                players[key]["name"] = raw_name
            players[key]["stats"][json_key] = {
                "primary":        row["primary"],
                "secondary":      row["secondary"],
                "primaryLabel":   label_info["primaryLabel"],
                "secondaryLabel": label_info["secondaryLabel"],
            }

    # Convert to sorted list (by minutes played desc, then name)
    player_list = list(players.values())
    player_list.sort(
        key=lambda p: (-(p["stats"].get("minutesPlayed", {}).get("primary") or 0), p["name"])
    )

    output = {
        "season":    "2025/26",
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "source":    "FotMob",
        "players":   player_list,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    size_kb = OUTPUT_PATH.stat().st_size / 1024
    print(f"\n[OK] Saved player_stats_fotmob.json ({len(player_list)} players, {size_kb:.1f} KB)")


if __name__ == "__main__":
    merge()
