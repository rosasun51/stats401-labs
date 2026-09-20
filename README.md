# 🌌 STATS 401 Labs — A Data Visualization Odyssey

> *"In data we trust, in D3 we delight."*  
> — Ruisheng (Rosa) Sun, probably at 2 AM debugging a force simulation

Welcome to my **STATS 401: Data Acquisition and Visualization** portfolio. This is not just a collection of homework assignments. It is a journey from "what is HTML?" to "let me animate a temporal network at 60fps." Built with blood, sweat, and an unreasonable amount of `console.log()` statements.

---

## 🚀 What's Inside?

10 labs. 1 website. Infinite particle backgrounds.

```text
stats401-labs/
├── index.html              # The mothership
├── css/
│   └── style.css           # Dark mode + glassmorphism + vibes
├── js/
│   └── main.js             # Console logs & sample data
├── data/                   # CSVs, JSONs, and the tears of malformed strings
│   ├── students.csv
│   ├── cities_multivariate.csv
│   ├── books_scraped.csv
│   ├── lab4_dirty_tweets.csv
│   ├── lab4_clean_tweets.csv
│   ├── lab5_assignment_stations.csv
│   ├── lab5_assignment_routes.csv
│   ├── lab6_assignment_gdp.csv
│   ├── lab6_gdp_hierarchy.json
│   ├── lab7_historical_weather.csv
│   ├── lab7_assignment_companies.csv
│   └── lab7_assignment_transactions_60days.csv
├── lab1/  →  lab10/        # One folder per lab
│   ├── index.html
│   └── *.js / *.py         # D3 code, Python scrapers, cleaning scripts
```

---

## 📊 The Lab Index

| Lab | Topic | Status | Highlights |
|-----|-------|--------|------------|
| **Lab 1** | Getting Started with D3.js | ✅ Complete | Animated bar chart, data binding, SVG |
| **Lab 2** | Multivariate Visualization | ✅ Complete | Bubble chart, 4 variables, color + size encoding |
| **Lab 3** | Web Data Acquisition | ✅ Complete | Scraped 1,000 books, sortable D3 table |
| **Lab 4** | Cleaning Web Data | ✅ Complete | Tweet cleaning, TF-IDF, sentiment analysis, RoBERTa |
| **Lab 5** | Network Visualization | ✅ Complete | Force-directed graph + adjacency matrix, 50 nodes |
| **Lab 6** | Hierarchical Data | ✅ Complete | Two treemaps (Squarify vs Binary), GDP hierarchy |
| **Lab 7** | Temporal Visualization | ✅ Complete | Weather line chart + animated temporal network |
| **Lab 8** | *Coming soon* | 🚧 Placeholder | TBD |
| **Lab 9** | *Coming soon* | 🚧 Placeholder | TBD |
| **Lab 10** | *Coming soon* | 🚧 Placeholder | TBD |

---

## 🎨 Design Philosophy

Every lab shares a unified dark-mode aesthetic because:
1. It looks cooler.
2. It reduces eye strain during late-night debugging.
3. It makes the charts pop.

**Visual features across all labs:**
- 🌌 **Animated particle background** (Canvas, 60 particles, distance-based connections)
- 🪟 **Glassmorphism cards** (`backdrop-filter: blur(20px)`)
- 🌈 **Gradient accents** (cyan → pink)
- 💬 **Visitor comment system** (localStorage-powered, because why not)
- 📱 **Responsive layout** (works on your phone, surprisingly)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Structure | HTML5 |
| Styling | CSS3 (custom properties, flexbox, grid) |
| Visualization | D3.js v7 |
| Data Processing | Python (pandas, BeautifulSoup, NLTK, scikit-learn, transformers) |
| Fonts | Inter (Google Fonts) |
| Hosting | GitHub Pages |
| Vibes | Immeasurable |

---

## 🏃 Quick Start

### 1. Clone & Navigate
```bash
git clone https://github.com/YOUR_USERNAME/stats401-labs.git
cd stats401-labs
```

### 2. Run a Local Server
**Do not** double-click `index.html`. Browsers hate loading CSVs from `file://`.

```bash
python -m http.server 8000
# or
python3 -m http.server 8000
```

Then open: [http://localhost:8000](http://localhost:8000)

### 3. Explore Labs
Click through the navigation bar. Each lab is self-contained.

---

## 🚀 Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "Initial commit — all labs complete"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stats401-labs.git
git push -u origin main
```

Then go to **Repository → Settings → Pages → Source: main branch / (root)**.

Your site will be live at:
```
https://YOUR_USERNAME.github.io/stats401-labs/
```

Direct lab links:
```
https://YOUR_USERNAME.github.io/stats401-labs/lab1/
https://YOUR_USERNAME.github.io/stats401-labs/lab2/
...
https://YOUR_USERNAME.github.io/stats401-labs/lab7/
```

---

## 🧪 Running Python Scripts

Some labs include Python data acquisition/cleaning scripts:

```bash
# Lab 3 — Scrape 1,000 books
cd lab3
python3 scrape_books.py

# Lab 4 — Clean tweets & sentiment analysis
cd lab4
python3 clean_tweets.py

# Lab 6 — Convert GDP CSV to hierarchical JSON
cd lab6
python3 convert_gdp.py
```

Dependencies:
```bash
pip install requests beautifulsoup4 pandas nltk scikit-learn
# Optional (slow, requires GPU for speed):
pip install transformers torch
```

---

## 👤 About the Author

**Ruisheng (Rosa) Sun**  
📧 rs689@duke.edu  
🎓 Duke University — STATS 401: Data Acquisition and Visualization

> "I came for the statistics. I stayed for the CSS animations."

---

## 📜 License

This is a coursework portfolio. Data sources:
- **Books to Scrape** (Lab 3) — scraping practice site
- **Synthetic data** (Labs 4–7) — generated for educational purposes
- All code is original unless otherwise noted.

---

*Built with D3.js, caffeine, and the stubborn belief that homework can be beautiful.*
