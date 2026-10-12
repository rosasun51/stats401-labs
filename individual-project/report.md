# Visualization Critique and Redesign: Life Expectancy

## Original visualization and context

The original visualization is Our World in Data’s “Life expectancy” bar chart, showing period life expectancy at birth for six entities in 2023: Oceania (79.1 years), Europe (79.1), the Americas (77.3), Asia (74.6), the World (73.2), and Africa (63.8). Its primary purpose is to let a general audience compare life expectancy across world regions. The interactive time slider provides an additional way to explore how these differences changed historically. The main tasks are to compare regional values, identify the highest and lowest regions, and explore historical changes. The data are available through Our World in Data’s life-expectancy grapher.

## Critique

**Strengths.** First, bars, direct value labels, and descending order make the 2023 ranking easy to read. Second, the design is relatively uncluttered, and the title and source information support clarity and transparency. Third, the interactive time slider and alternative Line, Map, and Table views give users additional ways to explore the data.

**Weaknesses.** First, the default chart shows only regional averages, hiding substantial variation among countries in the same region. For example, Asia’s average does not show the differences between countries such as Japan and Afghanistan. A country-level view would reveal this variation.

Second, the default view is a snapshot of 2023. Although the time slider can animate historical changes, animation is less effective for precise comparisons between two specific years because viewers must rely on memory. A static time-series view makes long-term trends easier to compare directly.

Third, the chart is optimized for a small set of regional comparisons. Comparing many countries can become difficult to interpret when users select numerous entities or view many lines. Ranking controls, search, and highlighting could make country-level exploration more manageable.

## Redesign rationale

I redesigned the visualization as a D3.js country-level line explorer using the Our World in Data life-expectancy dataset. Countries are represented as trajectories on a shared time axis from 1950 to the latest available year, colored by continent. A dashed World line provides a reference. The design includes Top 10, Top 20, Top 50, and All options, continent controls, country search, and hover highlighting with a tooltip.

**Decision 1: Show country-level trajectories and group them by continent.** Country-level lines reveal variation within regions and allow users to compare individual countries. Continent colors provide a meaningful grouping. The trade-off is that lines are less immediately readable than six bars, especially when many countries are displayed.

**Decision 2: Show historical trajectories directly.** The line chart presents changes over time in one view rather than requiring users to play an animation. The tooltip reports the value at the selected year and the change since the country’s first available year. Countries may have different starting years, so this change does not necessarily represent change since 1950 for every country.

**Decision 3: Add ranking, search, and focus controls.** Top-N options reduce the number of visible lines, continent controls help users focus on a region, and search makes a country easier to locate. Hover highlighting fades other lines to reduce visual competition. Showing all countries can still produce clutter, and Top-N rankings depend on the latest available values.

## Original versus redesign

The original chart is more effective for a quick comparison of six regional values in 2023. The redesign is more effective for exploring country-level differences and historical trajectories. The two views serve different purposes: the original prioritizes a concise overview, while the redesign prioritizes detailed exploration. Remaining limitations include possible overplotting, dependence on accurate continent-code mapping, and differences in country data coverage over time.

## Figures and references

**Figure 1.** Original visualization: “Life expectancy,” Our World in Data, Bar view for 2023. https://ourworldindata.org/grapher/life-expectancy

**Figure 2.** Redesigned D3.js country-level line explorer. Insert a screenshot of the working redesign.

**Data source.** Our World in Data, “Life expectancy” grapher and downloadable dataset: https://ourworldindata.org/grapher/life-expectancy. The source page lists underlying sources and attribution; check its current metadata for the exact dataset version used in the final submission.
