const tooltip = d3.select("#tooltip");

Promise.all([
    d3.csv("../data/sentiment_by_platform.csv"),
    d3.csv("../data/sentiment_by_weekday.csv", d => ({
        weekday: d.weekday,
        sentiment_score: +d.sentiment_score
    }))
]).then(([platformData, weekdayData]) => {
    console.log("Platform data:", platformData.length);
    console.log("Weekday data:", weekdayData.length);

    // ========== CHART 1: Sentiment by Platform ==========
    const margin1 = { top: 30, right: 30, bottom: 50, left: 50 };
    const w1 = 500 - margin1.left - margin1.right;
    const h1 = 320 - margin1.top - margin1.bottom;

    const svg1 = d3.select("#chart-platform")
        .append("svg")
        .attr("width", w1 + margin1.left + margin1.right)
        .attr("height", h1 + margin1.top + margin1.bottom)
        .append("g")
        .attr("transform", `translate(${margin1.left},${margin1.top})`);

    const platforms = Array.from(new Set(platformData.map(d => d.platform)));
    const sentiments = ["Positive", "Neutral", "Negative"];
    const color = d3.scaleOrdinal()
        .domain(sentiments)
        .range(["#22c55e", "#f59e0b", "#ef4444"]);

    const x0 = d3.scaleBand().domain(platforms).range([0, w1]).padding(0.2);
    const x1 = d3.scaleBand().domain(sentiments).range([0, x0.bandwidth()]).padding(0.05);
    const y1 = d3.scaleLinear()
        .domain([0, d3.max(platformData, d => +d.count) * 1.1])
        .nice()
        .range([h1, 0]);

    // Grid
    svg1.append("g")
        .call(d3.axisLeft(y1).tickSize(-w1).tickFormat(""))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("line").attr("stroke", "rgba(255,255,255,0.06)").attr("stroke-dasharray", "4,4"));

    // Axes
    svg1.append("g").attr("transform", `translate(0,${h1})`)
        .call(d3.axisBottom(x0).tickSize(0))
        .call(g => g.selectAll("text").attr("fill", "#94a3b8").attr("font-size", "12px"))
        .call(g => g.select(".domain").attr("stroke", "rgba(255,255,255,0.08)"));

    svg1.append("g")
        .call(d3.axisLeft(y1).ticks(5))
        .call(g => g.selectAll("text").attr("fill", "#94a3b8").attr("font-size", "11px"))
        .call(g => g.select(".domain").attr("stroke", "rgba(255,255,255,0.08)"));

    // Bars
    const platformGroups = svg1.selectAll(".platform-group")
        .data(platforms)
        .join("g")
        .attr("transform", d => `translate(${x0(d)},0)`);

    platformGroups.selectAll("rect")
        .data(p => sentiments.map(s => ({ sentiment: s, count: +platformData.find(d => d.platform === p && d.sentiment === s)?.count || 0, platform: p })))
        .join("rect")
        .attr("x", d => x1(d.sentiment))
        .attr("y", h1)
        .attr("width", x1.bandwidth())
        .attr("height", 0)
        .attr("fill", d => color(d.sentiment))
        .attr("rx", 4)
        .transition().duration(700).delay((d, i) => i * 80)
        .attr("y", d => y1(d.count))
        .attr("height", d => h1 - y1(d.count));

    // Labels
    platformGroups.selectAll(".bar-label")
        .data(p => sentiments.map(s => ({ sentiment: s, count: +platformData.find(d => d.platform === p && d.sentiment === s)?.count || 0 })))
        .join("text")
        .attr("x", d => x1(d.sentiment) + x1.bandwidth() / 2)
        .attr("y", d => y1(d.count) - 4)
        .attr("text-anchor", "middle")
        .attr("fill", "#e2e8f0")
        .attr("font-size", "10px")
        .text(d => d.count > 0 ? d.count : "")
        .attr("opacity", 0)
        .transition().duration(500).delay((d, i) => i * 80 + 400)
        .attr("opacity", 1);

    // Title
    svg1.append("text")
        .attr("x", w1 / 2).attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("fill", "#e2e8f0")
        .attr("font-size", "14px")
        .attr("font-weight", "700")
        .text("Sentiment by Platform");

    // Legend
    const legend1 = svg1.append("g").attr("transform", `translate(${w1 - 70}, 0)`);
    sentiments.forEach((s, i) => {
        const g = legend1.append("g").attr("transform", `translate(0, ${i * 18})`);
        g.append("rect").attr("width", 10).attr("height", 10).attr("rx", 2).attr("fill", color(s));
        g.append("text").attr("x", 14).attr("y", 9).attr("fill", "#94a3b8").attr("font-size", "11px").text(s);
    });

    // ========== CHART 2: Sentiment Score by Weekday ==========
    const margin2 = { top: 30, right: 30, bottom: 50, left: 50 };
    const w2 = 500 - margin2.left - margin2.right;
    const h2 = 320 - margin2.top - margin2.bottom;

    const svg2 = d3.select("#chart-weekday")
        .append("svg")
        .attr("width", w2 + margin2.left + margin2.right)
        .attr("height", h2 + margin2.top + margin2.bottom)
        .append("g")
        .attr("transform", `translate(${margin2.left},${margin2.top})`);

    const x2 = d3.scalePoint()
        .domain(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
        .range([0, w2])
        .padding(0.3);

    const y2 = d3.scaleLinear()
        .domain([-1, 1])
        .nice()
        .range([h2, 0]);

    // Zero line
    svg2.append("line")
        .attr("x1", 0).attr("x2", w2)
        .attr("y1", y2(0)).attr("y2", y2(0))
        .attr("stroke", "rgba(255,255,255,0.15)")
        .attr("stroke-dasharray", "4,4");

    // Grid
    svg2.append("g")
        .call(d3.axisLeft(y2).tickSize(-w2).tickFormat(""))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll("line").attr("stroke", "rgba(255,255,255,0.06)").attr("stroke-dasharray", "4,4"));

    // Axes
    svg2.append("g").attr("transform", `translate(0,${h2})`)
        .call(d3.axisBottom(x2).tickSize(0))
        .call(g => g.selectAll("text").attr("fill", "#94a3b8").attr("font-size", "11px"))
        .call(g => g.select(".domain").attr("stroke", "rgba(255,255,255,0.08)"));

    svg2.append("g")
        .call(d3.axisLeft(y2).ticks(5))
        .call(g => g.selectAll("text").attr("fill", "#94a3b8").attr("font-size", "11px"))
        .call(g => g.select(".domain").attr("stroke", "rgba(255,255,255,0.08)"));

    // Line
    const line = d3.line()
        .x(d => x2(d.weekday))
        .y(d => y2(d.sentiment_score))
        .curve(d3.curveMonotoneX);

    const path = svg2.append("path")
        .datum(weekdayData)
        .attr("fill", "none")
        .attr("stroke", "#38bdf8")
        .attr("stroke-width", 3)
        .attr("d", line);

    // Animate line
    const totalLength = path.node().getTotalLength();
    path.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition().duration(1200).ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0);

    // Dots
    svg2.selectAll(".dot")
        .data(weekdayData)
        .join("circle")
        .attr("class", "dot")
        .attr("cx", d => x2(d.weekday))
        .attr("cy", d => y2(d.sentiment_score))
        .attr("r", 0)
        .attr("fill", "#38bdf8")
        .attr("stroke", "#0f0f1a")
        .attr("stroke-width", 2)
        .transition().duration(500).delay((d, i) => i * 100 + 600)
        .attr("r", 5);

    // Title
    svg2.append("text")
        .attr("x", w2 / 2).attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("fill", "#e2e8f0")
        .attr("font-size", "14px")
        .attr("font-weight", "700")
        .text("Avg Sentiment Score by Weekday");

    // Tooltip for dots
    svg2.selectAll(".dot")
        .on("mouseover", function(event, d) {
            d3.select(this).transition().duration(150).attr("r", 8).attr("fill", "#f472b6");
            tooltip.style("opacity", 1)
                .html(`<strong>${d.weekday}</strong>Score: ${d.sentiment_score.toFixed(3)}`)
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 40) + "px");
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 40) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).transition().duration(150).attr("r", 5).attr("fill", "#38bdf8");
            tooltip.style("opacity", 0);
        });

}).catch(error => {
    console.error("Error loading data:", error);
    d3.select("#chart-platform").html(`<div style="color:#f87171;text-align:center;padding:40px;">⚠️ Run python3 clean_tweets.py first</div>`);
});