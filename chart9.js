document.addEventListener("DOMContentLoaded", function () {
    d3.csv("data.csv").then(data => {
        if (!data || data.length === 0) {
            console.error("Dữ liệu chưa được load hoặc rỗng!");
            return;
        }

        console.log("Dữ liệu đã load:", data);

        // Chuẩn hóa dữ liệu
        data.forEach(d => {
            d["Thời gian tạo đơn"] = new Date(d["Thời gian tạo đơn"]);
            d["Nhóm hàng"] = `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`;
            d["Mặt hàng"] = d["Tên mặt hàng"];
        });

        // Nhóm dữ liệu theo "Nhóm hàng" và "Mặt hàng", tính số đơn hàng duy nhất
        const groupedData = d3.rollup(
            data,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size,
            d => d["Nhóm hàng"],
            d => d["Mặt hàng"]
        );

        // Tính tổng số đơn hàng theo "Nhóm hàng"
        const soDonHang = d3.rollup(
            data,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size,
            d => d["Nhóm hàng"]
        );

        // Chuyển thành mảng và tính xác suất bán
        const dfGrouped9 = [];
        groupedData.forEach((items, group) => {
            items.forEach((count, item) => {
                const totalOrders = soDonHang.get(group) || 1; // Tránh chia cho 0
                dfGrouped9.push({
                    "Nhóm hàng": group,
                    "Mặt hàng": item,
                    "Mã đơn hàng": count,
                    "Số đơn hàng nhóm": totalOrders,
                    "Xác suất bán": count / totalOrders
                });
            });
        });

        // Lấy danh sách nhóm hàng duy nhất (giới hạn 5 nhóm đầu tiên)
        const nhomHang = [...new Set(dfGrouped9.map(d => d["Nhóm hàng"]))].slice(0, 5);

        // Kích thước và khoảng cách biểu đồ
        const margin = { top: 60, right: 50, bottom: 80, left: 250 };
        const width = 600 - margin.left - margin.right;
        const height = 350 - margin.top - margin.bottom;

        const svg = d3.select("#chart9")
            .append("svg")
            .attr("width", (width + margin.left + margin.right) * 3 + margin.left)
            .attr("height", (height + margin.top + margin.bottom) * 2 + 100); // Cộng thêm khoảng trống

        // Thêm tiêu đề chính
        svg.append("text")
            .attr("x", ((width + margin.left + margin.right) * 3 + margin.left) / 2)
            .attr("y", 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "20px")
            .attr("font-weight", "bold")
            .attr("fill", "#337ab7")
            .text("Xác suất bán hàng của Mặt hàng theo Nhóm hàng");

        // Vẽ các biểu đồ con
        nhomHang.forEach((nhom, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const g = svg.append("g")
                .attr("transform", `translate(${col * (width + margin.left + margin.right) + margin.left}, ${row * (height + margin.top + margin.bottom) + 80})`);

            // Lọc dữ liệu cho nhóm hàng hiện tại
            const data = dfGrouped9.filter(d => d["Nhóm hàng"] === nhom);

            // Tạo scale
            const xScale = d3.scaleLinear()
                .domain([0, d3.max(data, d => d["Xác suất bán"]) || 1])
                .range([0, width]);

            const yScale = d3.scaleBand()
                .domain(data.map(d => d["Mặt hàng"]))
                .range([0, height])
                .padding(0.3); // Khoảng cách giữa các cột

            // Tạo màu sắc
            const colorScale = d3.scaleOrdinal()
                .domain(data.map(d => d["Mặt hàng"]))
                .range(d3.schemeCategory10);

            // Vẽ thanh ngang
            g.selectAll(".bar")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("y", d => yScale(d["Mặt hàng"]))
                .attr("x", 0)
                .attr("height", yScale.bandwidth())
                .attr("width", d => xScale(d["Xác suất bán"]))
                .attr("fill", d => colorScale(d["Mặt hàng"]));

            // Hiển thị giá trị phần trăm
            g.selectAll(".label")
                .data(data)
                .enter()
                .append("text")
                .attr("class", "label")
                .attr("x", d => xScale(d["Xác suất bán"]) + 5)
                .attr("y", d => yScale(d["Mặt hàng"]) + yScale.bandwidth() / 2)
                .attr("dy", "0.35em")
                .attr("font-size", "12px")
                .text(d => (d["Xác suất bán"] * 100).toFixed(2) + "%");

            // Thêm trục X
            g.append("g")
                .attr("class", "axis")
                .attr("transform", `translate(0, ${height})`)
                .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".0%"))); // Hiển thị phần trăm

            // Thêm trục Y
            g.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale));

            // Tiêu đề nhóm hàng
            g.append("text")
                .attr("class", "title")
                .attr("x", width / 2)
                .attr("y", -30)
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .text(nhom);
        });

    }).catch(error => {
        console.error("Lỗi tải dữ liệu:", error);
    });
});
