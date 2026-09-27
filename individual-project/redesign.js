/* ===== Individual Project: Happiness Redesign ===== */
const tooltip = d3.select("#tooltip");

const metrics = {
    "GDP":            { label: "Log GDP per capita", color: "#38bdf8" },
    "SocialSupport":  { label: "Social Support",     color: "#f472b6" },
    "LifeExpectancy": { label: "Healthy Life Expectancy", color: "#22c55e" },
    "Freedom":        { label: "Freedom to Make Life Choices", color: "#f59e0b" },
};

const width = 900, height = 520;
const margin = { top: 30, right: 40, bottom: 60, left: 70 };

const svg = d3.select("#chart-redesign")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const x = d3.scaleLinear().range([margin.left, width - margin.right]);
const y = d3.scaleLinear().range([height - margin.bottom, margin.top]).nice();
const r = d3.scaleSqrt().domain([0, 1400]).range([4, 22]);

const regionColor = d3.scaleOrdinal()
    .domain(["Western Europe","North America & ANZ","Middle East & North Africa","Latin America & Caribbean","East Asia","South Asia","Commonwealth of Independent States","Central & Eastern Europe","Sub-Saharan Africa"])
    .range(["#4e79a7","#f28e2c","#e15759","#76b7b2","#59a14f","#edc949","#af7aa1","#ff9da7","#bcbd22"]);

const xAxisG = svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`);
const yAxisG = svg.append("g").attr("transform", `translate(${margin.left},0)`);
const gridG = svg.append("g").attr("opacity", 0.25);

// Labels
svg.append("text").attr("class", "x-label")
    .attr("x", width / 2).attr("y", height - 16)
    .attr("text-anchor", "middle").attr("fill", "#94a3b8").attr("font-size", 13);
svg.append("text").attr("class", "y-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height / 2)).attr("y", 20)
    .attr("text-anchor", "middle").attr("fill", "#94a3b8").attr("font-size", 13)
    .text("Happiness Score (Ladder)");

let allData, currentMetric = "GDP";

d3.csv("../data/world_happiness_2024.csv", d => ({
    Country: d.Country,
    Region: d.Region,
    Happiness: +d.Happiness,
    GDP: +d.GDP,
    SocialSupport: +d.SocialSupport,
    LifeExpectancy: +d.LifeExpectancy,
    Freedom: +d.Freedom,
    Population: +d.Population
})).then(data => {
    allData = data;
    console.log("Loaded", data.length, "countries");
    updateChart(currentMetric);

    // Metric buttons
    d3.selectAll(".metric-btn").on("click", function() {
        d3.selectAll(".metric-btn").classed("active", false);
        d3.select(this).classed("active", true);
        currentMetric = this.dataset.metric;
        updateChart(currentMetric);
    });

    // Region filter
    const regions = Array.from(new Set(data.map(d => d.Region)));
    const regionSelect = d3.select("#region-filter");
    regionSelect.append("option").attr("value", "").text("All Regions");
    regions.forEach(r => regionSelect.append("option").attr("value", r).text(r));
    regionSelect.on("change", function() {
        const val = this.value;
        svg.selectAll(".bubble")
            .attr("opacity", d => val === "" || d.Region === val ? 0.85 : 0.06)
            .attr("stroke-width", d => val === "" || d.Region === val ? 1.5 : 0);
    });

    // Build legend
    const legend = d3.select("#bubble-legend");
    regions.forEach(reg => {
        const g = legend.append("div").attr("class", "legend-group");
        g.append("span").attr("class", "legend-dot").style("background", regionColor(reg));
        g.append("span").text(reg);
    });
});

function updateChart(metric) {
    const m = metrics[metric];
    const vals = allData.map(d => d[metric]);
    x.domain(d3.extent(vals)).nice();
    y.domain(d3.extent(allData, d => d.Happiness)).nice();

    // Axes
    xAxisG.transition().duration(600).call(d3.axisBottom(x).ticks(8))
        .selectAll("text").attr("fill", "#94a3b8").attr("font-size", 11);
    xAxisG.selectAll("line, .domain").attr("stroke", "rgba(255,255,255,0.1)");
    svg.select(".x-label").text(m.label);

    yAxisG.transition().duration(600).call(d3.axisLeft(y).ticks(8))
        .selectAll("text").attr("fill", "#94a3b8").attr("font-size", 11);
    yAxisG.selectAll("line, .domain").attr("stroke", "rgba(255,255,255,0.1)");

    // Grid
    gridG.selectAll("*").remove();
    gridG.selectAll(".grid-line")
        .data(y.ticks(8))
        .join("line")
        .attr("x1", margin.left).attr("x2", width - margin.right)
        .attr("y1", d => y(d)).attr("y2", d => y(d))
        .attr("stroke", "rgba(255,255,255,0.06)").attr("stroke-dasharray", "4,4");

    // Bubbles
    const bubbles = svg.selectAll(".bubble")
        .data(allData, d => d.Country);

    bubbles.join(
        enter => enter.append("circle").attr("class", "bubble")
            .attr("cx", d => x(d[metric]))
            .attr("cy", d => y(d.Happiness))
            .attr("r", 0)
            .attr("fill", d => regionColor(d.Region))
            .attr("stroke", "rgba(255,255,255,0.4)")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.85)
            .style("cursor", "pointer")
            .call(enter => enter.transition().duration(700).delay((d,i) => i * 8)
                .attr("r", d => r(d.Population))),
        update => update.transition().duration(600)
            .attr("cx", d => x(d[metric]))
            .attr("cy", d => y(d.Happiness))
            .attr("fill", d => regionColor(d.Region)),
        exit => exit.transition().duration(300).attr("r", 0).remove()
    );

    // Tooltip events (re-attach)
    svg.selectAll(".bubble")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "#fff").attr("stroke-width", 3).attr("opacity", 1);
            tooltip.style("opacity", 1)
                .html(`<strong>${d.Country}</strong>
Region: ${d.Region}<br>
Happiness: ${d.Happiness}<br>
GDP: ${d.GDP} &bull; Social: ${d.SocialSupport}<br>
Life Exp: ${d.LifeExpectancy} &bull; Freedom: ${d.Freedom}<br>
Pop: ${d.Population}M`);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 50) + "px");
        })
        .on("mouseout", function() {
            const val = d3.select("#region-filter").property("value");
            d3.select(this).attr("stroke", "rgba(255,255,255,0.4)").attr("stroke-width", 1.5)
                .attr("opacity", d => val === "" || d.Region === val ? 0.85 : 0.06);
            tooltip.style("opacity", 0);
        });
}
