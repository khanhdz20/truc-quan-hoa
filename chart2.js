d3.csv("data.csv").then(data => {
    console.log("Dữ liệu gốc:", data);
    console.log("Cột có trong dữ liệu:", Object.keys(data[0]));

    data.forEach(d => {
        d["Thành tiền"] = +d["Thành tiền"] || 0;
        d["Thời gian tạo đơn"] = d3.timeParse("%Y-%m-%d %H:%M:%S")(d["Thời gian tạo đơn"]) || new Date();
    });

    const revenueByGroup = d3.rollups(
        data,
        v => d3.sum(v, d => d["Thành tiền"]),
        d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`
    ).map(([group, value]) => ({ group, value }));

    revenueByGroup.sort((a, b) => b.value - a.value);

    const customColors = {
        "[THO] Trà hoa": "#e74c3c",
        "[TTC] Trà củ, quả sấy": "#27ae60",
        "[SET] Set trà": "#f39c12",
        "[TMX] Trà mix": "#7fcdc9",
        "[BOT] Bột": "#4b6cb7"
    };

    const width = 1200;
    const height = 700;
    const margin = { top: 40, right: 250, bottom: 50, left: 220 };

    const x2 = d3.scaleLinear()
        .domain([0, d3.max(revenueByGroup, d => d.value)])
        .nice()
        .range([margin.left, width - margin.right]);

    const y2 = d3.scaleBand()
        .domain(revenueByGroup.map(d => d.group))
        .range([margin.top, height - margin.bottom])
        .padding(0.2);

    const svg2 = d3.select("#chart2")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    svg2.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x2).ticks(5).tickFormat(d => `${d / 1e6}M`));

    svg2.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y2));

    svg2.selectAll(".bar")
        .data(revenueByGroup)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", margin.left)
        .attr("y", d => y2(d.group))
        .attr("width", d => x2(d.value) - margin.left)
        .attr("height", y2.bandwidth())
        .attr("fill", d => customColors[d.group] || "#999")
        .on("mouseover", function () {
            d3.select(this).attr("opacity", 0.8);
        })
        .on("mouseout", function () {
            d3.select(this).attr("opacity", 1);
        });

    svg2.selectAll(".label")
        .data(revenueByGroup)
        .enter()
        .append("text")
        .attr("x", d => x2(d.value) + 10)
        .attr("y", d => y2(d.group) + y2.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("font-size", "14px")
        .attr("fill", "black")
        .text(d => `${Math.round(d.value / 1e6)} triệu VND`);

    svg2.append("text")
        .attr("x", width / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("fill", "#337ab7")
        .text("Doanh số bán hàng theo Nhóm hàng");
}).catch(error => console.error("Lỗi tải dữ liệu:", error));
