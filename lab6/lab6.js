/* ===== Lab 6: Hierarchical Data — Two Treemaps ===== */
const tooltip = d3.select("#tooltip");

const statusColors = { "Increase": "#22c55e", "Unchanged": "#f59e0b", "Decrease": "#ef4444" };

function getAncestors(d) {
    const path = [];
    let current = d;
    while (current) {
        path.unshift(current.data.name);
        current = current.parent;
    }
    return path;
}

function drawTreemap(containerId, tileMethod, titleText) {
    const width = 520;
    const height = 420;

    d3.json("../data/lab6_gdp_hierarchy.json").then(data => {
        const root = d3.hierarchy(data)
            .sum(d => d.value || 0)
            .sort((a, b) => b.value - a.value);

        const layout = d3.treemap()
            .tile(tileMethod)
            .size([width, height])
            .paddingInner(2)
            .paddingOuter(4)
            .round(true);

        layout(root);

        const svg = d3.select(containerId)
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        const leaves = root.leaves();

        const cell = svg.selectAll(".cell")
            .data(leaves)
            .join("g")
            .attr("class", "cell")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);

        // Rectangles
        cell.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => statusColors[d.data.gdp_status] || "#64748b")
            .attr("stroke", "rgba(0,0,0,0.3)")
            .attr("stroke-width", 0.5)
            .attr("rx", 2)
            .style("cursor", "pointer")
            .on("mouseover", function(event, d) {
                d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
                const path = getAncestors(d);
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.data.name}</strong>
Continent: ${path[1] || "—"}<br>
Area: ${path[2] || "—"}<br>
GDP: $${d.value.toLocaleString()}B<br>
Status: <span style="color:${statusColors[d.data.gdp_status]}">${d.data.gdp_status}</span>`);
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 40) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke", "rgba(0,0,0,0.3)").attr("stroke-width", 0.5);
                tooltip.style("opacity", 0);
            });

        // Labels (only if rectangle is large enough)
        cell.append("text")
            .attr("x", 4)
            .attr("y", 14)
            .attr("font-size", d => Math.min(13, (d.x1 - d.x0) / 6) + "px")
            .attr("font-weight", 600)
            .attr("fill", "#fff")
            .attr("pointer-events", "none")
            .text(d => (d.x1 - d.x0) > 45 && (d.y1 - d.y0) > 22 ? d.data.name : "")
            .style("text-shadow", "0 1px 3px rgba(0,0,0,0.6)");

        cell.append("text")
            .attr("x", 4)
            .attr("y", 26)
            .attr("font-size", d => Math.min(10, (d.x1 - d.x0) / 8) + "px")
            .attr("fill", "rgba(255,255,255,0.85)")
            .attr("pointer-events", "none")
            .text(d => (d.x1 - d.x0) > 55 && (d.y1 - d.y0) > 35 ? `$${d.value}B` : "")
            .style("text-shadow", "0 1px 2px rgba(0,0,0,0.5)");

        // Title
        svg.append("text")
            .attr("x", width / 2).attr("y", -8)
            .attr("text-anchor", "middle")
            .attr("fill", "#e2e8f0")
            .attr("font-size", "14px")
            .attr("font-weight", 700)
            .text(titleText);

    }).catch(err => {
        console.error(err);
        d3.select(containerId).html('<div style="color:#f87171;text-align:center;padding:40px;">⚠️ Failed to load data</div>');
    });
}

// Draw both treemaps
drawTreemap("#treemap-squarify", d3.treemapSquarify, "Squarify — Square-like rectangles");
drawTreemap("#treemap-binary", d3.treemapBinary, "Binary — Recursive bipartition");
