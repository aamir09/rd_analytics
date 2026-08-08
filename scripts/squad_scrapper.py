import requests
import pandas as pd
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from pathlib import Path

URL = "https://www.fotmob.com/teams/10260/squad/manchester-united"

headers = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    )
}

# =========================================================
# 1. Download page
# =========================================================

print(f">> Fetching squad details from {URL}...")
response = requests.get(URL, headers=headers)
response.raise_for_status()

html = response.text
soup = BeautifulSoup(html, "html.parser")


# =========================================================
# 2. Extract actual FotMob table
# =========================================================

tables = pd.read_html(html)
df = tables[0].copy()

print("Tables found:", len(tables))
print("Table rows:", len(df))


# =========================================================
# 3. Extract Player + Image
# =========================================================

player_data = []
name_spans = soup.select("span.css-1v1x2yd-SquadPlayerName")

for name_span in name_spans:
    player_name = name_span.get_text(strip=True)
    container = name_span
    image = None

    for _ in range(8):
        container = container.parent
        image = container.select_one("img.Image.PlayerImage.ImageWithFallback")
        if image:
            break

    image_url = None
    if image:
        image_url = (
            image.get("src")
            or image.get("data-src")
            or image.get("data-lazy-src")
        )
        if image_url:
            image_url = urljoin(URL, image_url)

    player_data.append({
        "Player": player_name,
        "Image": image_url
    })

players_df = pd.DataFrame(player_data)


# =========================================================
# 4. Keep Age + Shirt from the ORIGINAL table
# =========================================================

df = df.drop(columns=["Player"], errors="ignore")


# =========================================================
# 5. Add verified Player names & Images
# =========================================================

df.insert(0, "Player", players_df["Player"].values)
df["Image"] = players_df["Image"].values


# =========================================================
# 6. Reorder columns
# =========================================================

preferred_columns = [
    "Player",
    "Shirt",
    "Age",
    "Position",
    "Country",
    "Height",
    "Transfer value",
    "Image"
]

df = df[[col for col in preferred_columns if col in df.columns]]


# =========================================================
# 7. Clean Age + Shirt
# =========================================================

if "Age" in df.columns:
    df["Age"] = pd.to_numeric(df["Age"], errors="coerce").astype("Int64")

if "Shirt" in df.columns:
    df["Shirt"] = pd.to_numeric(df["Shirt"], errors="coerce").astype("Int64")


# =========================================================
# 8. Save output
# =========================================================

ROOT = Path(__file__).parent.parent if Path(__file__).parent.name == "scripts" else Path(__file__).parent
OUTPUT_FILE = ROOT / "public" / "data" / "squad_details.json"
OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

df.to_json(OUTPUT_FILE, orient='records', indent=4)
print(f"[OK] Saved squad details to {OUTPUT_FILE} ({len(df)} players)")