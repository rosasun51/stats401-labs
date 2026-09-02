"""
Lab 3 — Web Data Acquisition
Scrape 1,000+ book records from books.toscrape.com
"""

import requests
import time
import pandas as pd
from bs4 import BeautifulSoup

BASE_URL = "https://books.toscrape.com/catalogue/page-{}.html"
MAX_PAGES = 50          # 50 pages x 20 books = 1,000 books
DELAY_SECONDS = 1       # Rate limiting
OUTPUT_CSV = "../data/books_scraped.csv"

headers = {
    "User-Agent": "STATS401-Lab3-Exercise/1.0"
}

records = []

print("Starting web scraping...")

for page in range(1, MAX_PAGES + 1):
    url = BASE_URL.format(page)

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"  ⚠️ Failed on page {page}: {e}")
        continue

    soup = BeautifulSoup(response.text, "html.parser")
    books = soup.select("article.product_pod")

    for book in books:
        title = book.select_one("h3 a")["title"]

        price_text = book.select_one(".price_color").get_text(strip=True)
        price = float(price_text.replace("£", "").replace("Â", ""))

        rating_class = book.select_one("p.star-rating")["class"]
        rating_map = {
            "One": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5
        }
        rating = rating_map.get(rating_class[1], 0)

        availability = book.select_one(".availability").get_text(strip=True)

        records.append({
            "title": title,
            "price": price,
            "rating": rating,
            "availability": availability
        })

    print(f"  Page {page:2d}: {len(books)} books | Total: {len(records)}")

    # Rate limiting
    if page < MAX_PAGES:
        time.sleep(DELAY_SECONDS)

print(f"\nSaving {len(records)} records to {OUTPUT_CSV}...")
df = pd.DataFrame(records)
df.to_csv(OUTPUT_CSV, index=False)
print("Done!")
print(f"\nDataset preview:")
print(df.head(10).to_string(index=False))
print(f"\nShape: {df.shape}")
