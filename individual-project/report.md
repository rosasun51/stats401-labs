# Visualization Critique and Redesign Report

**Original visualization:** "Life expectancy", Our World in Data — https://ourworldindata.org/grapher/life-expectancy
**Data:** Riley (2005); Zijdeman et al. (2015); Human Mortality Database (2024); UN World Population Prospects (2024) — period life expectancy at birth, World/continents/~200 countries, CC BY 4.0 (CSV: `data/life-expectancy.csv`)
**Live redesign:** https://rosasun51.github.io/stats401-labs/individual-project/

## 1. Original visualization and context

The original is a **line chart** of period life expectancy at birth. Its default view shows six lines — World plus five continents — over 1543–2023, built from country-level data for roughly 200 countries. **Intended message:** life expectancy has roughly doubled since 1900, with persistent gaps between world regions. **Audience:** the general public and students. **Tasks:** compare places over time, see trends and convergence, and locate outliers.

## 2. Critique

**Strengths.** (1) The data are exceptional: long-run estimates back to 1543 on honest, zero-based axes — rare depth for a public chart. (2) The default view is clean and readable: six well-chosen lines, distinct colors, direct end labels — the headline story lands immediately. (3) On the source site, hovering pops up exact values for any point.

**Weaknesses.** (1) *The default view aggregates away the country level*, where the real stories live: the "Asia" line averages Japan (≈84 years) and Afghanistan (≈62); the "Africa" line hides a 20-year spread between countries. Viewers see convergence of continental averages, not the inequality and catch-up stories inside them. (2) *The path from the clean default to countries is broken.* Countries must be added from a 200+ entry flat list, one at a time; past a handful of lines, overplotting begins, and the 20-color categorical cycle repeats hues, so added lines become untrackable. (3) *No focus or grouping aids exist.* Every entity has identical visual weight; there are no end labels once countries are added; and quantitative deltas ("how many years did China gain since 1950?") must be estimated by eye against a distant baseline.

## 3. Redesign rationale

I kept the chart type and the data, and rebuilt it as an interactive, focusable country explorer in D3.js (v7), loading the same CSV with `d3.csv`.

*Decision 1 — color encodes continent, and the legend is a live filter.* Every country line is colored by its continent, and the legend is a row of continent chips: hovering a chip brightens that continent's countries and fades everything else; clicking pins that view. This fixes weaknesses 1 and 2 together: regional gaps (Nigeria vs. South Africa, Japan vs. Afghanistan) become visible *without* the flat hunting-list, and hue repetition stops mattering because color now carries continent, not identity.

*Decision 2 — hover to focus, with a quantitative tooltip.* Hovering a line (through a fat invisible hit-stroke so thin lines are easy to grab) keeps that country crisp, fades the other 200 lines to a ghost layer, and pops up a box with its value at the hovered year and its change since its first data year. This fixes weakness 3: exact numbers and deltas appear at the pointer, and comparison against the dashed World reference line is immediate.

*Decision 3 — ranked subsets plus search instead of overplotting.* A Top-10/20/50/All switch (ranked by latest value) sets a readable default, and an instant search box jumps to any country. End labels are drawn automatically when at most 25 countries are shown. This manages the 200-series problem honestly: the full dataset is one click away, but nobody is shown spaghetti by default or by accident.

## 4. Original vs. redesign

The redesign preserves what the original does well — long-run data, honest scales, exact values on hover — while making the country level reachable: continental gaps appear on a continent hover, single-country stories through focus-and-fade, and any country by search. Trade-offs: the Top-N cutoff is a choice rather than a fact; with many lines displayed, reading still depends on focus mode; and the continent aggregates were dropped in favor of countries plus a World reference line, since aggregates were the original's main weakness.

**Figures.** Figure 1 — original chart (screenshot from the OWID page linked above). Figure 2 — the redesigned explorer (live on the course GitHub Pages site).

**References.** "Life expectancy." Our World in Data. https://ourworldindata.org/grapher/life-expectancy (data: Riley 2005; Zijdeman et al. 2015; HMD 2024; UN WPP 2024; CC BY 4.0).
