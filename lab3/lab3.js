/* ===== Lab 3: Web Data Acquisition — Sortable Table ===== */
const tooltip = d3.select("#tooltip");

// Detect if a column is numeric
function isNumericColumn(data, column) {
    return data.every(d => !isNaN(+d[column]) && d[column] !== "");
}

// Load the scraped dataset
d3.csv("../data/books_scraped.csv")
    .then(data => {
        console.log("Loaded books data:", data.length, "records");

        const columns = data.columns;
        let sortState = {};  // track ascending/descending per column

        const table = d3.select("#data-table");

        // ===== HEADER =====
        const headerRow = table.select("thead")
            .append("tr");

        headerRow.selectAll("th")
            .data(columns)
            .join("th")
            .text(d => d)
            .attr("class", "sortable-header")
            .on("click", function(event, column) {
                const isNumeric = isNumericColumn(data, column);
                const ascending = !sortState[column];
                sortState[column] = ascending;

                data.sort((a, b) => {
                    let va = a[column];
                    let vb = b[column];
                    if (isNumeric) {
                        va = +va;
                        vb = +vb;
                    }
                    return ascending
                        ? d3.ascending(va, vb)
                        : d3.descending(va, vb);
                });

                // Update arrow indicators
                headerRow.selectAll("th")
                    .text(d => d + (sortState[d] !== undefined
                        ? (sortState[d] ? " ▲" : " ▼")
                        : ""));

                updateRows();
            });

        // ===== BODY =====
        function updateRows() {
            const rows = table.select("tbody")
                .selectAll("tr")
                .data(data)
                .join("tr");

            rows.selectAll("td")
                .data(row => columns.map(col => row[col]))
                .join("td")
                .text(d => d)
                .on("mouseover", function(event, d) {
                    d3.select(this.parentNode)
                        .style("background", "rgba(56,189,248,0.08)");
                })
                .on("mouseout", function() {
                    d3.select(this.parentNode)
                        .style("background", null);
                });
        }

        updateRows();

        // Update stats
        d3.select("#record-count").text(data.length);
    })
    .catch(error => {
        console.error("Error loading data:", error);
        d3.select("#data-table").html(`
            <tr><td colspan="4" style="padding:40px;text-align:center;color:#f87171;">
                ⚠️ Failed to load data. Please run a local server.
            </td></tr>
        `);
    });
