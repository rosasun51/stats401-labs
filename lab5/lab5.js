/* ===== Lab 5: Interactive Network Visualization ===== */
const tooltip = d3.select("#tooltip");

Promise.all([
    d3.csv("../data/lab5_assignment_stations.csv", d => ({
        id: d.id,
        station_name: d.station_name,
        district: d.district,
        daily_passengers: +d.daily_passengers,
        station_type: d.station_type
    })),
    d3.csv("../data/lab5_assignment_routes.csv", d => ({
        source: d.source,
        target: d.target,
        travel_time_min: +d.travel_time_min,
        route_type: d.route_type
    }))
]).then(([nodes, links]) => {
    console.log("Stations:", nodes.length, "Routes:", links.length);

    // Sort nodes by district for matrix + consistent coloring
    const districtOrder = { "Central": 0, "North": 1, "South": 2, "East": 3, "West": 4 };
    nodes.sort((a, b) => districtOrder[a.district] - districtOrder[b.district] || d3.ascending(a.id, b.id));

    // ===== SCALES =====
    const districts = ["Central", "North", "South", "East", "West"];
    const districtColors = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];
    const colorScale = d3.scaleOrdinal().domain(districts).range(districtColors);

    const sizeScale = d3.scaleSqrt()
        .domain(d3.extent(nodes, d => d.daily_passengers))
        .range([6, 18]);

    const routeTypes = ["Metro", "Express", "Shuttle"];
    const routeColors = ["#38bdf8", "#f472b6", "#94a3b8"];
    const linkColorScale = d3.scaleOrdinal().domain(routeTypes).range(routeColors);

    const linkWidthScale = d3.scaleLinear()
        .domain(d3.extent(links, d => d.travel_time_min))
        .range([1.5, 5]);

    // ===== PART A: NODE-LINK =====
    const width = 900, height = 600;
    const svg = d3.select("#chart-network")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Build adjacency lookup for highlighting
    const adjacency = {};
    nodes.forEach(n => adjacency[n.id] = new Set());
    links.forEach(l => {
        adjacency[l.source].add(l.target);
        adjacency[l.target].add(l.source);
    });

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(90))
        .force("charge", d3.forceManyBody().strength(-280))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(d => sizeScale(d.daily_passengers) + 6));

    // Links
    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", d => linkColorScale(d.route_type))
        .attr("stroke-width", d => linkWidthScale(d.travel_time_min))
        .attr("stroke-opacity", 0.65);

    // Nodes (groups with shapes)
    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("class", "node")
        .style("cursor", "pointer")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.each(function(d) {
        const g = d3.select(this);
        const r = sizeScale(d.daily_passengers);
        const fill = colorScale(d.district);
        if (d.station_type === "Local") {
            g.append("circle").attr("r", r).attr("fill", fill).attr("stroke", "#fff").attr("stroke-width", 1.5);
        } else if (d.station_type === "Transfer") {
            g.append("rect").attr("x", -r).attr("y", -r).attr("width", r*2).attr("height", r*2).attr("rx", 3)
                .attr("fill", fill).attr("stroke", "#fff").attr("stroke-width", 1.5);
        } else { // Terminal
            g.append("path").attr("d", `M0,${-r} L${r*0.9},0 L0,${r} L${-r*0.9},0 Z`)
                .attr("fill", fill).attr("stroke", "#fff").attr("stroke-width", 1.5);
        }
    });

    // Labels
    const label = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text(d => d.station_name)
        .attr("font-size", 10)
        .attr("font-weight", 600)
        .attr("fill", "#e2e8f0")
        .attr("dx", d => sizeScale(d.daily_passengers) + 4)
        .attr("dy", 3);

    // Tick
    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        node.attr("transform", d => `translate(${d.x},${d.y})`);
        label.attr("x", d => d.x).attr("y", d => d.y);
    });

    // Highlight + Tooltip
    node.on("mouseover", function(event, d) {
        const neighborIds = adjacency[d.id];
        node.attr("opacity", n => (n.id === d.id || neighborIds.has(n.id)) ? 1 : 0.12);
        link.attr("opacity", l => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.08);
        label.attr("opacity", n => (n.id === d.id || neighborIds.has(n.id)) ? 1 : 0.12);

        tooltip.style("opacity", 1)
            .html(`<strong>${d.station_name}</strong>
District: ${d.district}<br>
Passengers: ${d.daily_passengers.toLocaleString()}<br>
Type: ${d.station_type}<br>
Connections: ${neighborIds.size}`);
    })
    .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 40) + "px");
    })
    .on("mouseout", function() {
        node.attr("opacity", 1);
        link.attr("opacity", 0.65);
        label.attr("opacity", 1);
        tooltip.style("opacity", 0);
    });

    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
    }
    function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
    }

    // ===== PART B: ADJACENCY MATRIX =====
    const matrixSize = 520;
    const matMargin = { top: 80, left: 80 };
    const svgMat = d3.select("#chart-matrix")
        .append("svg")
        .attr("width", matrixSize + matMargin.left + 20)
        .attr("height", matrixSize + matMargin.top + 20);

    const matGroup = svgMat.append("g").attr("transform", `translate(${matMargin.left},${matMargin.top})`);

    const xMat = d3.scaleBand().domain(nodes.map(d => d.id)).range([0, matrixSize]).padding(0.02);
    const yMat = d3.scaleBand().domain(nodes.map(d => d.id)).range([0, matrixSize]).padding(0.02);

    // Build link lookup
    const linkMap = {};
    links.forEach(l => {
        linkMap[`${l.source.id}-${l.target.id}`] = l;
        linkMap[`${l.target.id}-${l.source.id}`] = l;
    });

    const opacityScale = d3.scaleLinear().domain(d3.extent(links, d => d.travel_time_min)).range([0.35, 1]);

    // Cells
    const cells = [];
    nodes.forEach(row => {
        nodes.forEach(col => {
            const key = `${row.id}-${col.id}`;
            const l = linkMap[key];
            cells.push({ row: row.id, col: col.id, weight: l ? l.travel_time_min : 0, type: l ? l.route_type : null, hasLink: !!l });
        });
    });

    matGroup.selectAll("rect")
        .data(cells)
        .join("rect")
        .attr("x", d => xMat(d.col))
        .attr("y", d => yMat(d.row))
        .attr("width", xMat.bandwidth())
        .attr("height", yMat.bandwidth())
        .attr("fill", d => d.hasLink ? linkColorScale(d.type) : "rgba(255,255,255,0.03)")
        .attr("fill-opacity", d => d.hasLink ? opacityScale(d.weight) : 1)
        .attr("stroke", "rgba(255,255,255,0.04)")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
            if (!d.hasLink) return;
            const src = nodes.find(n => n.id === d.row);
            const tgt = nodes.find(n => n.id === d.col);
            tooltip.style("opacity", 1)
                .html(`<strong>${src.station_name} ↔ ${tgt.station_name}</strong>
Time: ${d.weight} min<br>
Route: ${d.type}`);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 40) + "px");
        })
        .on("mouseout", function() { tooltip.style("opacity", 0); });

    // Row labels (district color)
    matGroup.selectAll(".row-label")
        .data(nodes)
        .join("text")
        .attr("class", "row-label")
        .attr("x", -6)
        .attr("y", d => yMat(d.id) + yMat.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("fill", d => colorScale(d.district))
        .attr("font-size", 8)
        .text(d => d.station_name);

    // Col labels
    matGroup.selectAll(".col-label")
        .data(nodes)
        .join("text")
        .attr("class", "col-label")
        .attr("x", d => xMat(d.id) + xMat.bandwidth() / 2)
        .attr("y", -6)
        .attr("text-anchor", "start")
        .attr("transform", d => `rotate(45, ${xMat(d.id) + xMat.bandwidth()/2}, -6)`)
        .attr("fill", d => colorScale(d.district))
        .attr("font-size", 8)
        .text(d => d.station_name);

    // District separators
    let lastDistrict = null;
    nodes.forEach((n, i) => {
        if (n.district !== lastDistrict && i > 0) {
            matGroup.append("line")
                .attr("x1", 0).attr("x2", matrixSize)
                .attr("y1", yMat(n.id)).attr("y2", yMat(n.id))
                .attr("stroke", "rgba(255,255,255,0.2)").attr("stroke-width", 1);
            matGroup.append("line")
                .attr("x1", xMat(n.id)).attr("x2", xMat(n.id))
                .attr("y1", 0).attr("y2", matrixSize)
                .attr("stroke", "rgba(255,255,255,0.2)").attr("stroke-width", 1);
        }
        lastDistrict = n.district;
    });

}).catch(err => {
    console.error(err);
    d3.select("#chart-network").html('<div style="color:#f87171;text-align:center;padding:40px;">⚠️ Load data failed. Run local server.</div>');
});
