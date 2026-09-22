/* ===== Lab 8: Semantic Embedding Map + Topic×Section Matrix ===== */
const tooltip = d3.select("#tooltip");

Promise.all([
    d3.csv("../data/lab8_embedding_map.csv", d => ({
        passage_id: d.passage_id,
        chapter: d.chapter,
        section: d.section,
        subsection: d.subsection,
        page: +d.page,
        text: d.text,
        word_count: +d.word_count,
        cluster: +d.cluster,
        cluster_name: d.cluster_name,
        x: +d.x,
        y: +d.y
    })),
    d3.csv("../data/lab8_topic_section_matrix.csv"),
    d3.json("../data/lab8_summary.json")
]).then(([passages, matrixData, summary]) => {
    console.log("Passages:", passages.length, "Matrix:", matrixData.length);

    // Update summary stats
    d3.select("#stat-total").text(summary.total_passages);
    d3.select("#stat-avg").text(summary.avg_word_count.toFixed(1));
    d3.select("#stat-sections").text(summary.sections);
    d3.select("#stat-clusters").text(summary.clusters);

    const clusters = Array.from(new Set(passages.map(d => d.cluster_name)));
    const sections = Array.from(new Set(passages.map(d => d.section)));
    const clusterColor = d3.scaleOrdinal().domain(clusters).range(d3.schemeTableau10);

    /* ========================================================
       VIEW 1: SEMANTIC EMBEDDING MAP
       ======================================================== */
    const mWidth = 700, mHeight = 520;
    const mMargin = { top: 20, right: 20, bottom: 40, left: 50 };

    const mapSvg = d3.select("#chart-semantic")
        .append("svg")
        .attr("width", mWidth)
        .attr("height", mHeight);

    const mapG = mapSvg.append("g");

    const xM = d3.scaleLinear()
        .domain(d3.extent(passages, d => d.x)).nice()
        .range([mMargin.left, mWidth - mMargin.right]);
    const yM = d3.scaleLinear()
        .domain(d3.extent(passages, d => d.y)).nice()
        .range([mHeight - mMargin.bottom, mMargin.top]);

    const sizeM = d3.scaleSqrt()
        .domain(d3.extent(passages, d => d.word_count))
        .range([4, 14]);

    // Zoom
    const zoom = d3.zoom()
        .scaleExtent([0.5, 8])
        .on("zoom", (event) => {
            mapG.attr("transform", event.transform);
        });
    mapSvg.call(zoom);

    // Points
    const points = mapG.selectAll(".passage-point")
        .data(passages)
        .join("circle")
        .attr("class", "passage-point")
        .attr("cx", d => xM(d.x))
        .attr("cy", d => yM(d.y))
        .attr("r", d => sizeM(d.word_count))
        .attr("fill", d => clusterColor(d.cluster_name))
        .attr("stroke", "rgba(255,255,255,0.3)")
        .attr("stroke-width", 1)
        .attr("opacity", 0.85)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2.5).attr("opacity", 1);
            tooltip.style("opacity", 1)
                .html(`<strong>${d.section}</strong>
Topic: ${d.cluster_name}<br>
Page: ${d.page} | Words: ${d.word_count}<br>
<span style="font-size:11px;color:#94a3b8;">${d.text.substring(0, 120)}...</span>`);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 40) + "px");
        })
        .on("mouseout", function() {
            if (!d3.select(this).classed("selected")) {
                d3.select(this).attr("stroke", "rgba(255,255,255,0.3)").attr("stroke-width", 1).attr("opacity", 0.85);
            }
            tooltip.style("opacity", 0);
        })
        .on("click", function(event, d) {
            selectPassage(d);
        });

    // Selected passage marker
    let selectedId = null;

    function selectPassage(d) {
        selectedId = d.passage_id;
        points.classed("selected", false)
            .attr("stroke", "rgba(255,255,255,0.3)").attr("stroke-width", 1).attr("opacity", 0.85);
        points.filter(p => p.passage_id === d.passage_id)
            .classed("selected", true)
            .attr("stroke", "#fff").attr("stroke-width", 3).attr("opacity", 1);

        // Detail panel
        d3.select("#detail-panel").html(`
            <div style="margin-bottom:8px;"><strong style="color:var(--accent);">${d.section}</strong></div>
            <div style="font-size:12px;color:var(--dim);margin-bottom:10px;">
                Chapter: ${d.chapter} &bull; Page: ${d.page} &bull; Topic: ${d.cluster_name} &bull; ${d.word_count} words
            </div>
            <div style="font-size:13px;line-height:1.6;color:var(--text);">${d.text}</div>
        `);

        // Highlight matrix cell
        matrixCells.attr("stroke", "rgba(255,255,255,0.05)").attr("stroke-width", 0.5);
        matrixCells.filter(c => c.section === d.section && c.cluster_name === d.cluster_name)
            .attr("stroke", "#fff").attr("stroke-width", 2);
    }

    // Search
    d3.select("#search-input").on("input", function() {
        const q = this.value.toLowerCase().trim();
        points.attr("opacity", d => {
            if (q === "") return 0.85;
            return d.text.toLowerCase().includes(q) ? 1 : 0.06;
        }).attr("stroke-width", d => {
            if (q === "") return 1;
            return d.text.toLowerCase().includes(q) ? 2 : 0.5;
        });
    });

    // Section filter
    const sectionSelect = d3.select("#section-filter");
    sectionSelect.append("option").attr("value", "").text("All Sections");
    sections.forEach(s => sectionSelect.append("option").attr("value", s).text(s));
    sectionSelect.on("change", function() {
        const val = this.value;
        points.attr("opacity", d => val === "" || d.section === val ? 0.85 : 0.06);
    });

    // Topic filter
    const topicSelect = d3.select("#topic-filter");
    topicSelect.append("option").attr("value", "").text("All Topics");
    clusters.forEach(c => topicSelect.append("option").attr("value", c).text(c));
    topicSelect.on("change", function() {
        const val = this.value;
        points.attr("opacity", d => val === "" || d.cluster_name === val ? 0.85 : 0.06);
    });

    // Nearest neighbors button
    d3.select("#nn-btn").on("click", function() {
        if (!selectedId) { alert("Click a point first."); return; }
        const target = passages.find(p => p.passage_id === selectedId);
        // Simple Euclidean distance in UMAP space
        const dists = passages.map(p => ({
            id: p.passage_id,
            dist: Math.sqrt((p.x - target.x)**2 + (p.y - target.y)**2),
            p: p
        }));
        dists.sort((a, b) => a.dist - b.dist);
        const neighbors = dists.slice(1, 6).map(d => d.p.passage_id);

        points.attr("opacity", d => neighbors.includes(d.passage_id) || d.passage_id === selectedId ? 1 : 0.08)
            .attr("stroke", d => neighbors.includes(d.passage_id) ? "#f472b6" : "rgba(255,255,255,0.3)")
            .attr("stroke-width", d => neighbors.includes(d.passage_id) || d.passage_id === selectedId ? 2.5 : 0.5);

        // Show neighbor list
        let html = `<strong>Nearest neighbors to ${target.section}:</strong><br>`;
        neighbors.forEach((nid, i) => {
            const n = passages.find(p => p.passage_id === nid);
            html += `<div style="margin:6px 0;font-size:12px;"><span style="color:#f472b6;">${i+1}.</span> ${n.section} — ${n.text.substring(0,80)}...</div>`;
        });
        d3.select("#detail-panel").html(html);
    });

    /* ========================================================
       VIEW 2: TOPIC × SECTION MATRIX
       ======================================================== */
    const matWidth = 520, matHeight = 400;
    const matMargin = { top: 60, left: 140, right: 20, bottom: 40 };

    const matSvg = d3.select("#chart-matrix")
        .append("svg")
        .attr("width", matWidth)
        .attr("height", matHeight);

    const matX = d3.scaleBand().domain(clusters).range([matMargin.left, matWidth - matMargin.right]).padding(0.05);
    const matY = d3.scaleBand().domain(sections).range([matMargin.top, matHeight - matMargin.bottom]).padding(0.05);

    const maxCount = d3.max(matrixData, d => +d.count);
    const matColor = d3.scaleSequential(d3.interpolateBlues).domain([0, maxCount]);

    const matrixCells = matSvg.selectAll(".mat-cell")
        .data(matrixData)
        .join("rect")
        .attr("class", "mat-cell")
        .attr("x", d => matX(d.cluster_name))
        .attr("y", d => matY(d.section))
        .attr("width", matX.bandwidth())
        .attr("height", matY.bandwidth())
        .attr("fill", d => matColor(+d.count))
        .attr("rx", 3)
        .attr("stroke", "rgba(255,255,255,0.05)")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
            tooltip.style("opacity", 1)
                .html(`<strong>${d.section}</strong> × ${d.cluster_name}<br>Passages: ${d.count}`);
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 40) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke", "rgba(255,255,255,0.05)").attr("stroke-width", 0.5);
            tooltip.style("opacity", 0);
        })
        .on("click", function(event, d) {
            // Coordinate: highlight matching points in semantic map
            points.attr("opacity", p => p.section === d.section && p.cluster_name === d.cluster_name ? 1 : 0.08)
                .attr("stroke", p => p.section === d.section && p.cluster_name === d.cluster_name ? "#fff" : "rgba(255,255,255,0.1)")
                .attr("stroke-width", p => p.section === d.section && p.cluster_name === d.cluster_name ? 2.5 : 0.5);

            // Reset filters
            sectionSelect.property("value", "");
            topicSelect.property("value", "");

            // Detail panel
            const matches = passages.filter(p => p.section === d.section && p.cluster_name === d.cluster_name);
            let html = `<strong>${d.section} × ${d.cluster_name}</strong> (${matches.length} passages)<br>`;
            matches.slice(0, 5).forEach(p => {
                html += `<div style="margin:4px 0;font-size:12px;color:var(--dim);">• ${p.text.substring(0,100)}...</div>`;
            });
            d3.select("#detail-panel").html(html);
        });

    // Matrix labels
    matSvg.selectAll(".mat-col-label")
        .data(clusters)
        .join("text")
        .attr("class", "mat-col-label")
        .attr("x", d => matX(d) + matX.bandwidth() / 2)
        .attr("y", matMargin.top - 8)
        .attr("text-anchor", "middle")
        .attr("fill", "#94a3b8")
        .attr("font-size", 10)
        .attr("transform", d => `rotate(-30, ${matX(d) + matX.bandwidth()/2}, ${matMargin.top - 8})`)
        .text(d => d);

    matSvg.selectAll(".mat-row-label")
        .data(sections)
        .join("text")
        .attr("class", "mat-row-label")
        .attr("x", matMargin.left - 8)
        .attr("y", d => matY(d) + matY.bandwidth() / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#94a3b8")
        .attr("font-size", 10)
        .text(d => d);

    // Matrix title
    matSvg.append("text")
        .attr("x", matWidth / 2).attr("y", 18)
        .attr("text-anchor", "middle")
        .attr("fill", "#e2e8f0")
        .attr("font-size", 13)
        .attr("font-weight", 700)
        .text("Topic × Section Matrix");

}).catch(err => {
    console.error(err);
    d3.select("#chart-semantic").html('<div style="color:#f87171;text-align:center;padding:40px;">⚠️ Failed to load data. Run local server.</div>');
});
