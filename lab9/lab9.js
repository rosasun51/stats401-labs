/* ===== Lab 9: Choropleth + Cartogram ===== */
const tooltip = d3.select("#tooltip");

Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
    d3.csv("../data/lab9_gdp_2025_top50.csv", d => ({
        iso3: d.iso3,
        country: d.country,
        gdp: +d.gdp_2025_billion_usd,
        rank: +d.rank
    }))
]).then(([world, gdpData]) => {
    // Convert TopoJSON to GeoJSON
    const countries = topojson.feature(world, world.objects.countries).features;
    const gdpByIso = new Map(gdpData.map(d => [d.iso3, d]));

    // Attach GDP to GeoJSON features
    countries.forEach(d => {
        const info = gdpByIso.get(d.id);
        d.properties.gdp = info ? info.gdp : null;
        d.properties.country_name = info ? info.country : d.properties.name;
        d.properties.hasData = !!info;
    });

    const dataCountries = countries.filter(d => d.properties.hasData);
    const gdpValues = dataCountries.map(d => d.properties.gdp);
    const maxGDP = d3.max(gdpValues);

    // Color scale: log-transformed sequential (GDP is highly skewed)
    const colorScale = d3.scaleSequential()
        .domain([0, Math.log(maxGDP)])
        .interpolator(d3.interpolateBlues);

    function gdpColor(gdp) {
        if (gdp == null || gdp <= 0) return "#1a1a2e";
        return colorScale(Math.log(gdp));
    }

    /* ========================================================
       CHOROPLETH
       ======================================================== */
    const cWidth = 520, cHeight = 320;
    const cSvg = d3.select("#chart-choropleth").append("svg")
        .attr("width", cWidth).attr("height", cHeight);
    const cGroup = cSvg.append("g");

    const projection = d3.geoNaturalEarth1()
        .fitSize([cWidth, cHeight], { type: "FeatureCollection", features: countries });
    const path = d3.geoPath().projection(projection);

    // Zoom
    const zoom = d3.zoom().scaleExtent([1, 8])
        .on("zoom", e => cGroup.attr("transform", e.transform));
    cSvg.call(zoom);

    let selectedId = null;

    const cPaths = cGroup.selectAll(".country")
        .data(countries)
        .join("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", d => gdpColor(d.properties.gdp))
        .attr("stroke", "rgba(255,255,255,0.15)")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            if (d.id !== selectedId) {
                d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1.5);
            }
            const g = d.properties.gdp;
            tooltip.style("opacity", 1)
                .html(`<strong>${d.properties.country_name}</strong>
${g ? "GDP 2025: $" + g.toLocaleString() + "B" : "No data"}
${d.properties.rank ? "Rank: #" + d.properties.rank : ""}`);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 40) + "px");
        })
        .on("mouseout", function(event, d) {
            if (d.id !== selectedId) {
                d3.select(this).attr("stroke", "rgba(255,255,255,0.15)").attr("stroke-width", 0.5);
            }
            tooltip.style("opacity", 0);
        })
        .on("click", function(event, d) {
            selectCountry(d.id);
        });

    /* ========================================================
       CARTOGRAM (simplified: scale paths around centroid)
       ======================================================== */
    const cartWidth = 520, cartHeight = 320;
    const cartSvg = d3.select("#chart-cartogram").append("svg")
        .attr("width", cartWidth).attr("height", cartHeight);
    const cartGroup = cartSvg.append("g");

    const cartProjection = d3.geoNaturalEarth1()
        .fitSize([cartWidth, cartHeight], { type: "FeatureCollection", features: countries });
    const cartPath = d3.geoPath().projection(cartProjection);

    // Compute projected centroids and scales
    const medianGDP = d3.median(gdpValues);
    const centroids = new Map();
    const scales = new Map();

    countries.forEach(d => {
        const centroid = cartProjection(d3.geoCentroid(d));
        centroids.set(d.id, centroid);
        const gdp = d.properties.gdp;
        if (gdp) {
            const s = Math.sqrt(gdp / medianGDP);
            scales.set(d.id, Math.max(0.4, Math.min(3.5, s)));
        }
    });

    const cartZoom = d3.zoom().scaleExtent([1, 8])
        .on("zoom", e => cartGroup.attr("transform", e.transform));
    cartSvg.call(cartZoom);

    const cartPaths = cartGroup.selectAll(".country")
        .data(countries)
        .join("path")
        .attr("class", "country")
        .attr("d", cartPath)
        .attr("fill", d => gdpColor(d.properties.gdp))
        .attr("stroke", "rgba(255,255,255,0.15)")
        .attr("stroke-width", 0.5)
        .attr("transform", d => {
            const s = scales.get(d.id);
            if (!s) return "";
            const [cx, cy] = centroids.get(d.id);
            return `translate(${cx},${cy}) scale(${s}) translate(${-cx},${-cy})`;
        })
        .style("cursor", "pointer")
        .style("opacity", d => d.properties.hasData ? 0.9 : 0.3)
        .on("mouseover", function(event, d) {
            if (d.id !== selectedId) {
                d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1.5);
            }
            const g = d.properties.gdp;
            tooltip.style("opacity", 1)
                .html(`<strong>${d.properties.country_name}</strong>
${g ? "GDP 2025: $" + g.toLocaleString() + "B" : "No data"}
${d.properties.rank ? "Rank: #" + d.properties.rank : ""}`);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 40) + "px");
        })
        .on("mouseout", function(event, d) {
            if (d.id !== selectedId) {
                d3.select(this).attr("stroke", "rgba(255,255,255,0.15)").attr("stroke-width", 0.5);
            }
            tooltip.style("opacity", 0);
        })
        .on("click", function(event, d) {
            selectCountry(d.id);
        });

    /* ========================================================
       LINKED HIGHLIGHTING
       ======================================================== */
    function selectCountry(id) {
        selectedId = id;
        cPaths.attr("stroke", d => d.id === id ? "#f472b6" : "rgba(255,255,255,0.15)")
            .attr("stroke-width", d => d.id === id ? 3 : 0.5);
        cartPaths.attr("stroke", d => d.id === id ? "#f472b6" : "rgba(255,255,255,0.15)")
            .attr("stroke-width", d => d.id === id ? 3 : 0.5);

        const d = countries.find(c => c.id === id);
        if (d && d.properties.hasData) {
            d3.select("#detail-panel").html(`
                <div style="margin-bottom:8px;"><strong style="color:var(--accent);font-size:1.1rem;">${d.properties.country_name}</strong></div>
                <div style="font-size:13px;color:var(--dim);line-height:1.7;">
                    GDP 2025: <strong style="color:var(--text);">$${d.properties.gdp.toLocaleString()} billion</strong><br>
                    Rank: <strong style="color:var(--text);">#${d.properties.rank}</strong><br>
                    Share of top-50 total: <strong style="color:var(--text);">${((d.properties.gdp / d3.sum(gdpValues)) * 100).toFixed(1)}%</strong>
                </div>
            `);
        }
    }

    /* ========================================================
       LEGEND
       ======================================================== */
    const legendSvg = d3.select("#legend-choropleth").append("svg")
        .attr("width", 320).attr("height", 50);
    const legendData = [100, 500, 1000, 5000, 10000, 30000];
    const lScale = d3.scaleLinear().domain([0, legendData.length - 1]).range([10, 310]);

    legendSvg.selectAll("rect")
        .data(legendData)
        .join("rect")
        .attr("x", (d, i) => lScale(i) - 12)
        .attr("y", 10)
        .attr("width", 24)
        .attr("height", 16)
        .attr("fill", d => gdpColor(d))
        .attr("rx", 3);

    legendSvg.selectAll("text")
        .data(legendData)
        .join("text")
        .attr("x", (d, i) => lScale(i))
        .attr("y", 42)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .attr("font-size", 10)
        .text(d => d >= 1000 ? (d/1000) + "T" : d + "B");

    legendSvg.append("text")
        .attr("x", 160).attr("y", 8)
        .attr("text-anchor", "middle")
        .attr("fill", "#e2e8f0")
        .attr("font-size", 11)
        .attr("font-weight", 600)
        .text("GDP 2025 (billions USD, log scale)");

}).catch(err => {
    console.error(err);
    d3.select("#chart-choropleth").html('<div style="color:#f87172;text-align:center;padding:40px;">⚠️ Failed to load map data. Check internet connection.</div>');
});
