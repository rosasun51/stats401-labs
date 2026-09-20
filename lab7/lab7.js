/* ===== Lab 7: Weather Line Chart + Temporal Network ===== */
const tooltip = d3.select("#tooltip");

/* ============================================================
   PART 1 — WEATHER LINE CHART
   ============================================================ */
const weatherMetrics = {
    "temperature_c":    { label: "Temperature (°C)",   color: "#ef4444" },
    "humidity_pct":     { label: "Humidity (%)",       color: "#3b82f6" },
    "wind_speed_mps":   { label: "Wind Speed (m/s)",   color: "#22c55e" },
    "pressure_hpa":     { label: "Pressure (hPa)",     color: "#a855f7" },
    "precipitation_mm": { label: "Precipitation (mm)", color: "#f59e0b" }
};

const wWidth = 900, wHeight = 420;
const wMargin = { top: 30, right: 40, bottom: 50, left: 60 };

const weatherSvg = d3.select("#chart-weather")
    .append("svg")
    .attr("width", wWidth)
    .attr("height", wHeight);

// Scales
const xW = d3.scaleTime().range([wMargin.left, wWidth - wMargin.right]);
const yW = d3.scaleLinear().range([wHeight - wMargin.bottom, wMargin.top]).nice();

const weatherColor = d3.scaleOrdinal()
    .domain(["New York","London","Tokyo","Singapore","Sydney","Cairo","São Paulo","Toronto"])
    .range(d3.schemeTableau10);

// Axes groups
const xAxisG = weatherSvg.append("g").attr("transform", `translate(0,${wHeight - wMargin.bottom})`);
const yAxisG = weatherSvg.append("g").attr("transform", `translate(${wMargin.left},0)`);

// Grid
const gridG = weatherSvg.append("g").attr("opacity", 0.3);

// Line generator
const lineGen = d3.line().curve(d3.curveMonotoneX)
    .x(d => xW(d.date))
    .y(d => yW(d.value));

// Brush
const brush = d3.brushX()
    .extent([[wMargin.left, wMargin.top], [wWidth - wMargin.right, wHeight - wMargin.bottom]])
    .on("end", brushed);

weatherSvg.append("g").attr("class", "brush").call(brush);

// Hover overlay
const hoverLine = weatherSvg.append("line")
    .attr("stroke", "rgba(255,255,255,0.3)")
    .attr("stroke-dasharray", "4,4")
    .attr("y1", wMargin.top)
    .attr("y2", wHeight - wMargin.bottom)
    .style("opacity", 0);

const hoverDots = weatherSvg.append("g").attr("class", "hover-dots");

let weatherData, weatherGrouped, currentMetric = "temperature_c";

// Load weather data
d3.csv("../data/lab7_historical_weather.csv", d => ({
    date: d3.timeParse("%Y-%m-%d")(d.date),
    city: d.city,
    temperature_c: +d.temperature_c,
    humidity_pct: +d.humidity_pct,
    wind_speed_mps: +d.wind_speed_mps,
    pressure_hpa: +d.pressure_hpa,
    precipitation_mm: +d.precipitation_mm
})).then(data => {
    weatherData = data;
    weatherGrouped = d3.group(data, d => d.city);
    updateWeatherChart(currentMetric);

    // Metric selector
    d3.select("#metric-select").on("change", function() {
        currentMetric = this.value;
        updateWeatherChart(currentMetric);
    });

    // Hover
    weatherSvg.on("mousemove", weatherMouseMove)
              .on("mouseleave", () => { hoverLine.style("opacity", 0); hoverDots.selectAll("*").remove(); tooltip.style("opacity", 0); });
});

function updateWeatherChart(metric) {
    const cities = Array.from(weatherGrouped.keys());
    const allValues = weatherData.map(d => d[metric]);
    xW.domain(d3.extent(weatherData, d => d.date));
    yW.domain(d3.extent(allValues)).nice();

    // Axes
    xAxisG.transition().duration(500).call(d3.axisBottom(xW).ticks(6).tickFormat(d3.timeFormat("%b %d")))
        .selectAll("text").attr("fill", "#94a3b8").attr("font-size", 11);
    xAxisG.selectAll("line, .domain").attr("stroke", "rgba(255,255,255,0.1)");

    yAxisG.transition().duration(500).call(d3.axisLeft(yW).ticks(6))
        .selectAll("text").attr("fill", "#94a3b8").attr("font-size", 11);
    yAxisG.selectAll("line, .domain").attr("stroke", "rgba(255,255,255,0.1)");

    // Grid
    gridG.selectAll("*").remove();
    gridG.selectAll(".grid-line")
        .data(yW.ticks(6))
        .join("line")
        .attr("x1", wMargin.left).attr("x2", wWidth - wMargin.right)
        .attr("y1", d => yW(d)).attr("y2", d => yW(d))
        .attr("stroke", "rgba(255,255,255,0.06)").attr("stroke-dasharray", "4,4");

    // Y label
    weatherSvg.selectAll(".y-label").remove();
    weatherSvg.append("text").attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -(wHeight/2)).attr("y", 18)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8").attr("font-size", 12)
        .text(weatherMetrics[metric].label);

    // Lines
    const lines = weatherSvg.selectAll(".weather-line")
        .data(cities, d => d);

    lines.join(
        enter => enter.append("path").attr("class", "weather-line")
            .attr("fill", "none")
            .attr("stroke", d => weatherColor(d))
            .attr("stroke-width", 2)
            .attr("stroke-opacity", 0.85)
            .attr("d", d => lineGen(weatherGrouped.get(d).map(v => ({date: v.date, value: v[metric]}))))
            .attr("stroke-dasharray", function() { const l = this.getTotalLength(); return `${l} ${l}`; })
            .attr("stroke-dashoffset", function() { return this.getTotalLength(); })
            .call(enter => enter.transition().duration(900).attr("stroke-dashoffset", 0)),
        update => update.transition().duration(500)
            .attr("stroke", d => weatherColor(d))
            .attr("d", d => lineGen(weatherGrouped.get(d).map(v => ({date: v.date, value: v[metric]})))),
        exit => exit.remove()
    );
}

function weatherMouseMove(event) {
    const [mx] = d3.pointer(event);
    if (mx < wMargin.left || mx > wWidth - wMargin.right) return;

    const date = xW.invert(mx);
    const bisect = d3.bisector(d => d.date).left;
    const cities = Array.from(weatherGrouped.keys());

    hoverLine.attr("x1", mx).attr("x2", mx).style("opacity", 1);

    const dots = hoverDots.selectAll("circle")
        .data(cities, d => d);

    dots.join("circle")
        .attr("r", 4)
        .attr("fill", d => weatherColor(d))
        .attr("stroke", "#fff").attr("stroke-width", 1.5)
        .attr("cx", mx)
        .attr("cy", d => {
            const arr = weatherGrouped.get(d);
            const i = bisect(arr, date);
            const pt = arr[Math.min(i, arr.length - 1)];
            return yW(pt[currentMetric]);
        });

    // Tooltip with all cities
    let html = `<strong>${d3.timeFormat("%Y-%m-%d")(date)}</strong><br>`;
    html += `<span style="color:${weatherMetrics[currentMetric].color}">${weatherMetrics[currentMetric].label}</span><br>`;
    cities.forEach(city => {
        const arr = weatherGrouped.get(city);
        const i = bisect(arr, date);
        const pt = arr[Math.min(i, arr.length - 1)];
        html += `<span style="color:${weatherColor(city)};font-size:11px;">● ${city}: ${pt[currentMetric]}</span><br>`;
    });
    tooltip.style("opacity", 1).html(html)
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 40) + "px");
}

function brushed(event) {
    if (!event.selection) return;
    const [x0, x1] = event.selection;
    const start = xW.invert(x0);
    const end = xW.invert(x1);
    d3.select("#brush-info").text(`Selected: ${d3.timeFormat("%b %d")(start)} – ${d3.timeFormat("%b %d")(end)}`);
}


/* ============================================================
   PART 2 — TEMPORAL NETWORK (unchanged from previous)
   ============================================================ */
Promise.all([
    d3.csv("../data/lab7_assignment_companies.csv", d => ({
        id: d.id, company_name: d.company_name, sector: d.sector, region: d.region
    })),
    d3.csv("../data/lab7_assignment_transactions_60days.csv", d => ({
        date: d.date, day: +d.day, source: d.source, target: d.target,
        amount_usd: +d.amount_usd, transaction_type: d.transaction_type, transaction_count: +d.transaction_count
    }))
]).then(([companies, transactions]) => {
    const DAYS = 60;
    const width = 900, height = 560;
    const transByDay = d3.group(transactions, d => d.day);

    const regions = ["Asia", "North America", "Europe"];
    const regionColors = ["#ef4444", "#3b82f6", "#22c55e"];
    const colorScale = d3.scaleOrdinal().domain(regions).range(regionColors);
    const types = ["goods", "shipping", "components", "materials", "services"];
    const typeColors = ["#38bdf8", "#f472b6", "#a78bfa", "#fbbf24", "#94a3b8"];
    const typeColorScale = d3.scaleOrdinal().domain(types).range(typeColors);

    const svg = d3.select("#chart-network").append("svg").attr("width", width).attr("height", height);
    const linkGroup = svg.append("g").attr("class", "links");
    const nodeGroup = svg.append("g").attr("class", "nodes");
    const labelGroup = svg.append("g").attr("class", "labels");

    const dayLabel = svg.append("text").attr("x", width - 20).attr("y", 30)
        .attr("text-anchor", "end").attr("fill", "#e2e8f0").attr("font-size", "22px").attr("font-weight", 700);
    const statsLabel = svg.append("text").attr("x", 20).attr("y", 30)
        .attr("fill", "#94a3b8").attr("font-size", "12px");

    const simulation = d3.forceSimulation(companies)
        .force("link", d3.forceLink().id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-350))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(28));

    const node = nodeGroup.selectAll(".node").data(companies, d => d.id)
        .join("g").attr("class", "node").style("cursor", "pointer")
        .call(d3.drag()
            .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
            .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
            .on("end", (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    node.append("circle").attr("r", 12).attr("fill", d => colorScale(d.region))
        .attr("stroke", "rgba(255,255,255,0.4)").attr("stroke-width", 2);

    const labels = labelGroup.selectAll("text").data(companies, d => d.id)
        .join("text").text(d => d.company_name).attr("font-size", 10).attr("font-weight", 600)
        .attr("fill", "#e2e8f0").attr("dx", 14).attr("dy", 4);

    node.on("mouseover", function(event, d) {
        tooltip.style("opacity", 1).html(`<strong>${d.company_name}</strong>
Sector: ${d.sector}<br>
Region: ${d.region}`);
    }).on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 40) + "px");
    }).on("mouseout", function() { tooltip.style("opacity", 0); });

    simulation.on("tick", () => {
        linkGroup.selectAll("line")
            .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        node.attr("transform", d => `translate(${d.x},${d.y})`);
        labels.attr("x", d => d.x).attr("y", d => d.y);
    });

    function updateDay(day) {
        const dayLinks = transByDay.get(day) || [];
        const volume = {};
        companies.forEach(c => volume[c.id] = 0);
        dayLinks.forEach(l => {
            volume[l.source] = (volume[l.source] || 0) + l.amount_usd;
            volume[l.target] = (volume[l.target] || 0) + l.amount_usd;
        });
        const maxVol = d3.max(Object.values(volume)) || 1;
        const sizeScale = d3.scaleSqrt().domain([0, maxVol]).range([8, 28]);

        node.selectAll("circle").transition().duration(300)
            .attr("r", d => sizeScale(volume[d.id] || 0))
            .attr("stroke-width", d => (volume[d.id] || 0) > maxVol * 0.5 ? 3 : 2);

        const link = linkGroup.selectAll("line")
            .data(dayLinks, d => `${d.source}-${d.target}`)
            .join(
                enter => enter.append("line")
                    .attr("stroke", d => typeColorScale(d.transaction_type))
                    .attr("stroke-width", d => Math.max(1, Math.log10(d.amount_usd / 1000)))
                    .attr("stroke-opacity", 0).attr("stroke-linecap", "round")
                    .call(enter => enter.transition().duration(400).attr("stroke-opacity", 0.7)),
                update => update
                    .attr("stroke", d => typeColorScale(d.transaction_type))
                    .attr("stroke-width", d => Math.max(1, Math.log10(d.amount_usd / 1000))),
                exit => exit.transition().duration(400).attr("stroke-opacity", 0).remove()
            );

        simulation.force("link").links(dayLinks.map(d => ({source: d.source, target: d.target})));
        simulation.alpha(0.15).restart();

        const activeIds = new Set(dayLinks.flatMap(d => [d.source, d.target]));
        const totalValue = d3.sum(dayLinks, d => d.amount_usd);
        dayLabel.text(`Day ${day}  —  ${dayLinks.length} links  —  $${(totalValue/1000).toFixed(0)}K`);
        statsLabel.text(`Active companies: ${activeIds.size} / ${companies.length}`);
        d3.select("#time-slider").property("value", day);
    }

    let currentDay = 1, timer = null, isPlaying = false;

    function showFrame(day) { currentDay = day; updateDay(day); }
    function play() {
        if (isPlaying) return;
        isPlaying = true;
        d3.select("#play-btn").text("⏸ Pause");
        timer = d3.interval(() => {
            showFrame(currentDay);
            currentDay += 1;
            if (currentDay > DAYS) { pause(); currentDay = DAYS; }
        }, 400);
    }
    function pause() {
        isPlaying = false;
        d3.select("#play-btn").text("▶ Play");
        if (timer) { timer.stop(); timer = null; }
    }
    function reset() { pause(); currentDay = 1; showFrame(1); }

    d3.select("#play-btn").on("click", () => { isPlaying ? pause() : play(); });
    d3.select("#reset-btn").on("click", reset);
    d3.select("#time-slider").attr("max", DAYS)
        .on("input", function() { pause(); showFrame(+this.value); });

    showFrame(1);
});
