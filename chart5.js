document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        console.log("Dữ liệu đã load:", data);

        const margin = { top: 40, right: 40, bottom: 70, left: 60 },
              width = 1000 - margin.left - margin.right,
              height = 450 - margin.top - margin.bottom;

        // Chuyển đổi dữ liệu
        data.forEach(d => {
            d["Thành tiền"] = isNaN(+d["Thành tiền"]) ? 0 : +d["Thành tiền"];
            d["SL"] = isNaN(+d["SL"]) ? 0 : +d["SL"];
            d["Thời gian tạo đơn"] = d3.timeParse("%Y-%m-%d %H:%M:%S")(d["Thời gian tạo đơn"]);
        });

        // Tổng hợp dữ liệu theo ngày trong tháng
        const aggregatedData = Array.from(
            d3.rollups(data, 
                v => ({
                    "Thành tiền": d3.sum(v, d => d["Thành tiền"]),
                    "SL": d3.sum(v, d => d["SL"]),
                    "Ngày tạo đơn": new Set(v.map(d => d3.timeFormat("%Y-%m-%d")(d["Thời gian tạo đơn"])))
                }),
                d => `Ngày ${d["Thời gian tạo đơn"].getDate().toString().padStart(2, '0')}`
            )
        ).map(([key, values]) => ({
            "Ngày trong tháng": key,
            "Thành tiền": values["Thành tiền"],
            "SL": values["SL"],
            "Doanh số bán TB": values["Thành tiền"] / values["Ngày tạo đơn"].size,
            "Số lượng bán TB": values["SL"] / values["Ngày tạo đơn"].size
        })).sort((a, b) => parseInt(a["Ngày trong tháng"].split(' ')[1]) - parseInt(b["Ngày trong tháng"].split(' ')[1]));

        const svg = d3.select("#chart5")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(aggregatedData.map(d => d["Ngày trong tháng"]))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(aggregatedData, d => d["Doanh số bán TB"] * 1.2)])
            .nice()
            .range([height, 0]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        svg.selectAll(".bar")
            .data(aggregatedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d["Ngày trong tháng"]))
            .attr("y", height)
            .attr("width", x.bandwidth())
            .attr("height", 0)
            .attr("fill", d => colorScale(d["Ngày trong tháng"]))
            .transition()
            .duration(800)
            .attr("y", d => y(d["Doanh số bán TB"]))
            .attr("height", d => height - y(d["Doanh số bán TB"]));

        svg.selectAll(".label")
            .data(aggregatedData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => x(d["Ngày trong tháng"]) + x.bandwidth() / 2)
            .attr("y", height - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text(d => `${(d["Doanh số bán TB"] / 1_000_000).toFixed(1)} tr`)
            .transition()
            .duration(800)
            .attr("y", d => y(d["Doanh số bán TB"]) - 5);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d => `${(d / 1_000_000).toFixed(0)}M`).ticks(10));

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("fill", "#337ab7")
            .text("Doanh số bán hàng trung bình theo Ngày trong tháng");
    }).catch(error => console.error("Lỗi tải dữ liệu:", error));
});