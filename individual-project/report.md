# Visualization Critique and Redesign Report

**Original visualization:** "Coffee production by world region, 1961 to 2024", Our World in Data — https://ourworldindata.org/grapher/coffee-production-by-region
**Data:** Food and Agriculture Organization of the UN (FAOSTAT, 2025), processed by Our World in Data, CC BY 4.0 (CSV: `data/coffee-production-by-region.csv`)
**Live redesign:** https://YOUR_USERNAME.github.io/stats401-labs/individual-project/

## 1. Original visualization and context

The original is a **stacked area chart** of coffee production (tonnes of green, unroasted beans) from 1961 to 2024 for six world regions: South America, Asia, Africa, North America, Oceania, and Europe. **Intended message:** world coffee output has roughly tripled, South America remains the dominant producer, and production has shifted from Africa toward Asia (driven by Vietnam). **Audience:** the general public and students. **Tasks:** compare regions over time, identify trends and turning points, and locate shocks such as the frost-driven dips in South American output.

## 2. Critique

**Strengths.** (1) Stacking makes the *total* easy to read, because the top edge of the stack sits on a common baseline — growth from ~4 to ~11 million tonnes is immediately visible. (2) The design is honest and clean: the y-axis starts at zero, gridlines are light, colors are distinguishable, and source and unit are stated clearly.

**Weaknesses.** (1) *Comparisons across stacked layers are difficult.* Only the bottom layer (South America) has a flat baseline; comparing Asia with Africa means judging the changing vertical thickness of floating bands — a perceptually inaccurate task, so the headline "Asia up, Africa flat" shift is harder to see than it should be. (2) *The side color legend imposes memory load.* Six colors are identified in a legend at the right edge, forcing repeated back-and-forth eye movements, and the thin top layers (Oceania, Europe) are nearly indistinguishable. (3) *Stacked jaggedness hides individual trends.* Year-to-year weather shocks make the bands spiky, but inside a stack you cannot tell which region caused a dip, and small regions are squashed into a few pixels at the top.

## 3. Redesign rationale

I rebuilt the chart in **D3.js (v7)** as interactive **small-multiple line charts**, one panel per region, using the same CSV (loaded with `d3.csv` from an external file).

*Decision 1 — small multiples instead of stacking.* Every region gets its own line on a shared y-axis, so every comparison uses position on a common scale — our most accurate visual channel. This fixes weakness 1: Asia overtaking Africa around 2000 and Africa's later stagnation become directly visible shapes. Trade-off: the *total* is no longer shown; I accept this because the interesting story is a regional comparison task, not a total task.

*Decision 2 — direct labeling, no legend.* Each panel is titled with its region name; the same color is used per region across panels. This fixes weakness 2: label and mark are adjacent, so viewers no longer memorize a legend.

*Decision 3 — interactivity targeted at the tasks.* Hovering shows a tooltip with the exact year and tonnage; clickable chips show or hide regions; a Linear/Log toggle rescales the y-axis. This fixes weakness 3: each region's frost-year dips are visible in its own panel, and the log view makes Oceania and Europe readable. These interactions use D3 scales, line generators, and data joins, driven by the external CSV.

## 4. Original vs. redesign

Regional comparisons, the Asia–Africa crossover, and weather shocks are now substantially easier to see and explain; small regions are no longer invisible; exact values are one hover away. Remaining limitations: totals are not shown (the original remains linked on the page), small multiples take more vertical space, and the shared linear scale still compresses small regions — mitigated, not eliminated, by the log toggle.

**Figures.** Figure 1 — original stacked area chart (screenshot from the OWID page linked above). Figure 2 — redesigned small multiples (live on the course GitHub Pages site).

**References.** "Coffee production by world region." Our World in Data. https://ourworldindata.org/grapher/coffee-production-by-region (data: FAO, 2025; CC BY 4.0).
