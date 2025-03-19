document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        console.log("Dữ liệu đã load:", data);

        // Định nghĩa kích thước
        const margin = { top: 60, right: 200, bottom: 100, left: 200 },
            width = 900 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // Chuyển đổi dữ liệu
        const data1 = data.map(d => ({
            "Mã đơn hàng": d["Mã đơn hàng"],
            "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
            "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
            "SL": parseFloat(d["SL"]) || 0,
            "Tháng tạo đơn": `Tháng ${new Date(d["Thời gian tạo đơn"]).getMonth() + 1}` // Lấy tháng chính xác từ dữ liệu
        }));

        // Tính tổng số đơn hàng theo tháng
        const totalOrdersByMonth = {};
        data1.forEach(item => {
            const month = item["Tháng tạo đơn"];
            if (!totalOrdersByMonth[month]) {
                totalOrdersByMonth[month] = new Set();
            }
            totalOrdersByMonth[month].add(item["Mã đơn hàng"]);
        });

        // Tổng hợp dữ liệu theo nhóm hàng và tháng
        const aggregatedData = {};
        data1.forEach(item => {
            const key = `${item["Tháng tạo đơn"]}|${item["Nhóm hàng"]}`;
            if (!aggregatedData[key]) {
                aggregatedData[key] = {
                    "Tháng": item["Tháng tạo đơn"],
                    "Nhóm hàng": item["Nhóm hàng"],
                    "Mã đơn hàng": new Set(),
                    "SL": 0
                };
            }
            aggregatedData[key]["Mã đơn hàng"].add(item["Mã đơn hàng"]);
            aggregatedData[key]["SL"] += item["SL"];
        });

        // Chuyển đổi dữ liệu về mảng và tính xác suất bán
        const finalData = Object.values(aggregatedData).map(d => ({
            ...d,
            "Xác suất bán": (d["Mã đơn hàng"].size / totalOrdersByMonth[d["Tháng"]].size) * 100,
            "SL Đơn Bán": d["Mã đơn hàng"].size
        }));

        // Tạo SVG
        const svg = d3.select("#chart8")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Thang đo X
        const x = d3.scaleBand()
            .domain(["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"])
            .range([0, width])
            .padding(0.1);

        // Thang đo Y (tự động lấy min/max)
        const y = d3.scaleLinear()
            .domain([0, d3.max(finalData, d => d["Xác suất bán"])]).nice()
            .range([height, 0]);

        // Màu sắc cho nhóm hàng
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Nhóm dữ liệu theo Nhóm hàng
        const groupedData = d3.groups(finalData, d => d["Nhóm hàng"]);

        // Vẽ đường biểu diễn dữ liệu
        const line = d3.line()
            .x(d => x(d["Tháng"]) + x.bandwidth() / 2)
            .y(d => y(d["Xác suất bán"]));

        svg.selectAll(".line")
            .data(groupedData)
            .enter()
            .append("path")
            .attr("class", "line")
            .attr("d", d => line(d[1]))
            .attr("stroke", d => colorScale(d[0]))
            .attr("fill", "none")
            .attr("stroke-width", 2);

        // Vẽ marker trên các điểm
        svg.selectAll(".marker")
            .data(finalData)
            .enter()
            .append("circle")
            .attr("class", "marker")
            .attr("cx", d => x(d["Tháng"]) + x.bandwidth() / 2)
            .attr("cy", d => y(d["Xác suất bán"]))
            .attr("r", 4)
            .attr("fill", d => colorScale(d["Nhóm hàng"]));

        // Trục X
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .style("font-size", "11px");

        // Trục Y
        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d => `${d}%`).ticks(10))
            .style("font-size", "11px");

        // Thêm tiêu đề biểu đồ
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("fill", "#337ab7")
            .text("Xác suất bán hàng của Nhóm hàng theo Tháng");

    }).catch(error => console.error("Lỗi tải dữ liệu:", error));
});
