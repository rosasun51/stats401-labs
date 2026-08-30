/* ===== Lab 2: Multivariate Visualization ===== */
const width = 900;
const height = 520;
const margin = { top: 40, right: 170, bottom: 60, left: 60 };

const tooltip = d3.select("#tooltip");

// Requirement: Load dataset using d3.csv
// Requirement: Convert population and temp_c to numbers
d3.csv("../data/cities_multivariate.csv", d => ({
    city: d.city,
    population: +d.population,
    temp_c: +d.temp_c,
    development_level: d.development_level,
    region: d.region
}))
.then(data => {
    console.log("Loaded cities data:", data);

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // ===== SCALES =====
    const regions = ["North", "South", "East", "West"];
    const devLevels = ["Low", "Medium", "High"];

    // X: region (nominal) — band scale
    const x = d3.scaleBand()
        .domain(regions)
        .range([margin.left, width - margin.right])
        .padding(0.35);

    // Y: temp_c (interval) — linear scale
    const y = d3.scaleLinear()
        .domain([8, 28])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Size: population (ratio) — sqrt scale so area ∝ population
    const r = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.population)])
        .range([5, 30]);

    // Color: development_level (ordinal)
    const color = d3.scaleOrdinal()
        .domain(devLevels)
        .range(["#ef4444", "#f59e0b", "#22c55e"]);

    // ===== AXES & GRID =====
    // Horizontal grid lines
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y)
            .tickSize(-(width - margin.left - margin.right))
            .tickFormat(""))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("line")
            .attr("stroke", "rgba(255,255,255,0.06)")
            .attr("stroke-dasharray", "4,4"));

    // X axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSize(0))
        .call(g => g.selectAll("text")
            .attr("fill", "#94a3b8")
            .attr("font-size", "13px")
            .attr("font-weight", "600"))
        .call(g => g.select(".domain").attr("stroke", "rgba(255,255,255,0.08)"));

    // Y axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6))
        .call(g => g.selectAll("text")
            .attr("fill", "#94a3b8")
            .attr("font-size", "12px"))
        .call(g => g.select(".domain").attr("stroke", "rgba(255,255,255,0.08)"))
        .call(g => g.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.08)"));

    // Axis labels
    svg.append("text")
        .attr("x", (margin.left + width - margin.right) / 2)
        .attr("y", height - 16)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .attr("font-size", "14px")
        .text("Region");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .attr("font-size", "14px")
        .text("Average Temperature (°C)");

    // ===== POSITION WITHIN EACH REGION BAND =====
    // Distribute cities evenly within their region band to avoid overlap
    const bandWidth = x.bandwidth();
    regions.forEach(region => {
        const regionData = data.filter(d => d.region === region)
            .sort((a, b) => a.temp_c - b.temp_c);
        const step = bandWidth / (regionData.length + 1);
        regionData.forEach((d, i) => {
            d.cx = x(region) + step * (i + 1);
        });
    });

    // ===== DRAW BUBBLES =====
    const bubbles = svg.selectAll(".city-bubble")
        .data(data)
        .join("circle")
        .attr("class", "city-bubble")
        .attr("cx", d => d.cx)
        .attr("cy", d => y(d.temp_c))
        .attr("r", 0)
        .attr("fill", d => color(d.development_level))
        .attr("opacity", 0.75)
        .attr("stroke", "rgba(255,255,255,0.3)")
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer");

    // Animate bubbles growing
    bubbles.transition()
        .duration(800)
        .delay((d, i) => i * 70)
        .ease(d3.easeBackOut.overshoot(1.2))
        .attr("r", d => r(d.population));

    // ===== CITY LABELS =====
    // Requirement: viewer can identify each city
    svg.selectAll(".city-label")
        .data(data)
        .join("text")
        .attr("class", "city-label")
        .attr("x", d => d.cx)
        .attr("y", d => y(d.temp_c) - r(d.population) - 7)
        .text(d => d.city)
        .attr("text-anchor", "middle")
        .attr("fill", "#e2e8f0")
        .attr("font-size", "11px")
        .attr("font-weight", "600")
        .attr("opacity", 0)
        .transition()
        .duration(500)
        .delay((d, i) => i * 70 + 500)
        .attr("opacity", 1);

    // ===== TOOLTIP INTERACTION =====
    bubbles
        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition().duration(150)
                .attr("opacity", 1)
                .attr("stroke", "#fff")
                .attr("stroke-width", 2.5);

            tooltip.style("opacity", 1)
                .html(`
                    <strong>${d.city}</strong>
                    Region: ${d.region}<br>
                    Temperature: ${d.temp_c}°C<br>
                    Population: ${d.population}M<br>
                    Development: ${d.development_level}
                `);
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 40) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .transition().duration(150)
                .attr("opacity", 0.75)
                .attr("stroke", "rgba(255,255,255,0.3)")
                .attr("stroke-width", 1.5);
            tooltip.style("opacity", 0);
        });

    // ===== LEGEND: Development Level (color) =====
    const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right + 30}, ${margin.top})`);

    legend.append("text")
        .attr("x", 0).attr("y", 0)
        .attr("fill", "#e2e8f0")
        .attr("font-size", "13px")
        .attr("font-weight", "700")
        .text("Development");

    devLevels.forEach((level, i) => {
        const g = legend.append("g")
            .attr("transform", `translate(0, ${22 + i * 24})`);
        g.append("circle")
            .attr("r", 7)
            .attr("fill", color(level))
            .attr("stroke", "rgba(255,255,255,0.3)")
            .attr("stroke-width", 1);
        g.append("text")
            .attr("x", 16).attr("y", 4)
            .attr("fill", "#94a3b8")
            .attr("font-size", "12px")
            .text(level);
    });

    // ===== LEGEND: Population (size) =====
    const legendSize = svg.append("g")
        .attr("transform", `translate(${width - margin.right + 30}, ${margin.top + 110})`);

    legendSize.append("text")
        .attr("x", 0).attr("y", 0)
        .attr("fill", "#e2e8f0")
        .attr("font-size", "13px")
        .attr("font-weight", "700")
        .text("Population");

    const popValues = [0.5, 1.5, 3.0];
    popValues.forEach((val, i) => {
        const g = legendSize.append("g")
            .attr("transform", `translate(0, ${18 + i * 34})`);
        g.append("circle")
            .attr("r", r(val))
            .attr("fill", "none")
            .attr("stroke", "#94a3b8")
            .attr("stroke-width", 1);
        g.append("text")
            .attr("x", 38).attr("y", 4)
            .attr("fill", "#94a3b8")
            .attr("font-size", "11px")
            .text(val + "M");
    });

})
.catch(error => {
    console.error("Error loading data:", error);
    d3.select("#chart").html(`
        <div style="padding:40px;text-align:center;color:#f87171;">
            <p style="font-size:1.1rem;margin-bottom:10px;">⚠️ Failed to load data</p>
            <p style="color:#94a3b8;">Please run a local server: python -m http.server 8000</p>
        </div>
    `);
});
