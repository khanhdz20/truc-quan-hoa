// Đọc dữ liệu từ file CSV
d3.csv("data.csv").then(data => {
    // Chuyển đổi dữ liệu từ chuỗi sang số
    data.forEach(d => {
        d["Thành tiền"] = +d["Thành tiền"];
    });

    // Tổng hợp doanh thu theo mặt hàng và nhóm hàng
    const revenueByProduct = d3.rollups(
        data,
        v => ({
            value: d3.sum(v, d => d["Thành tiền"]),
            group: v[0]["Tên nhóm hàng"]
        }),
        d => `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`
    ).map(([name, obj]) => ({ name, value: obj.value, group: obj.group }));

    // Sắp xếp dữ liệu theo doanh số giảm dần
    revenueByProduct.sort((a, b) => b.value - a.value);

    // Danh sách màu mới theo hình ảnh mẫu
    const colorMapping = {
        "Bột": "#4361ee", // Màu xanh đậm
        "Set trà": "#f4a261", // Màu cam
        "Trà hoa": "#e63946", // Màu đỏ
        "Trà mix": "#8ecae6", // Màu xanh nhạt
        "Trà củ, quả sấy": "#2a9d8f" // Màu xanh lá
    };

    // Kích thước SVG
    const width = 1400;
    const height = 700;
    const margin = { top: 50, right: 300, bottom: 80, left: 280 };

    // Tạo thẻ SVG
    const svg = d3.select("#chart1")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Tạo scale
    const x = d3.scaleLinear()
        .domain([0, d3.max(revenueByProduct, d => d.value)])
        .nice()
        .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
        .domain(revenueByProduct.map(d => d.name))
        .range([margin.top, height - margin.bottom])
        .padding(0.2);

    // Vẽ trục X
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d => `${d / 1e6}M`))
        .style("font-size", "14px");

    // Vẽ trục Y
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .style("font-size", "14px");

    // Vẽ các cột
    svg.selectAll(".bar")
        .data(revenueByProduct)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", margin.left)
        .attr("y", d => y(d.name))
        .attr("width", d => x(d.value) - margin.left)
        .attr("height", y.bandwidth())
        .attr("fill", d => colorMapping[d.group] || "#adb5bd")
        .on("mouseover", function () {
            d3.select(this).attr("opacity", 0.7);
        })
        .on("mouseout", function () {
            d3.select(this).attr("opacity", 1);
        });

    // Thêm nhãn giá trị doanh số bên trên cột
    svg.selectAll(".label")
        .data(revenueByProduct)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d.value) + 5)
        .attr("y", d => y(d.name) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .text(d => `${(d.value / 1e6).toFixed(0)} triệu VND`)
        .style("font-size", "14px")
        .style("fill", "black");

    // Thêm tiêu đề
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "22px")
        .style("font-weight", "bold")
        .style("fill", "#5A189A")
        .text("Doanh số bán hàng theo Mặt hàng");

    // Thêm chú thích màu sắc (Legend)
    const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right + 50}, ${margin.top})`);

    Object.keys(colorMapping).forEach((group, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", i * 25)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", colorMapping[group]);

        legend.append("text")
            .attr("x", 30)
            .attr("y", i * 25 + 15)
            .text(group)
            .style("font-size", "14px")
            .attr("alignment-baseline", "middle");
    });
}).catch(error => console.error("Lỗi tải dữ liệu:", error));