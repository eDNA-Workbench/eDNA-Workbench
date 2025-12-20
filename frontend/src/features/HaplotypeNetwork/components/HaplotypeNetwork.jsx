// HaplotypeNetwork.jsx
// 使用 D3 建立帶城市分群與連線距離的單倍型網絡圖視覺化

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { saveAs } from "file-saver";
import { Canvg } from 'canvg';

import "./styles/HaplotypeNetwork.css";

function oklchToRgb(L, C, H) {
  const x = C * Math.cos(H);
  const y = C * Math.sin(H);
  
  const ref = 0.2 + 0.5 * (L + 1);
  const r = ref + x;
  const g = ref - y;
  const b = ref - x;
  
  // 返回 RGB 格式的顏色
  return {
    r: Math.min(255, Math.max(0, r * 255)),
    g: Math.min(255, Math.max(0, g * 255)),
    b: Math.min(255, Math.max(0, b * 255))
  };
}

const HaplotypeNetwork = ({ width = 800, height = 800 , genes  }) => {
  const svgRef = useRef();
  const [data, setData] = useState(null);
  const [cityColors, setCityColors] = useState({});
  const [cityColorMap, setCityColorMap] = useState({});
  const [apiPath, setApiPath] = useState("HaplotypeNetwork");
  const [scaleFactor, setScaleFactor] = useState(1); // 控制節點與距離的縮放

  const [isConfigured, setIsConfigured] = useState(false); // 用來判斷是否完成設定
  const [loading, setLoading] = useState(true);

  const [countRange, setCountRange] = useState({ min: 0, max: 100 });
  const [fetchedRange, setFetchedRange] = useState({ min: 0, max: 100 });

  useEffect(() => {
  if (genes && genes.length > 0) {
    const geneName = genes[0].name; 

    if (geneName.includes(",") && geneName.match(/^[a-zA-Z0-9_,-]+(,hap_\d+_\d+)+$/)) {
      setApiPath("HaplotypeNetwork");
    }
    else if (geneName.includes("_") && !geneName.includes(",")) {
      setApiPath("SimplifiedHaplotypeNetwork");
    }
    else {
      setApiPath("HaplotypeNetwork");
    }
  }
}, [genes]);

useEffect(() => {
        console.log("apiPath:",apiPath)
        console.log("genes:",genes)
      }, [apiPath,genes]);

  // 載入資料
  useEffect(() => {
    setLoading(true); 
    setData(null); // Clear previous data

    // 發送範圍篩選請求
    fetch(`http://localhost:3000/api/haplotypes/${apiPath}?min=${countRange.min}&max=${countRange.max}`)
      .then((res) => res.json())
      .then((newData) => {
        setData(newData);
        setLoading(false); 
      })
      .catch(() => {
        setData({ error: true });
        setLoading(false); 
      });
  }, [apiPath, countRange]);

  useEffect(() => {
    if (apiPath) {
      fetch("http://localhost:3000/api/haplotypes/HaplotypeCountRange")
        .then((res) => res.json())
        .then((countRangeData) => {
          setCountRange(countRangeData.countRange);
          setFetchedRange(countRangeData.countRange);
        })
        .catch(() => {
          console.error("Failed to fetch count range");
        });
    }
  }, [apiPath]);

  // 初始化圖表
  useEffect(() => {
    if (!data?.nodes || !data?.edges) return;

    const validNodes = data.nodes.filter(
      (d) => typeof d.count === "number" && d.count > 0
    );
    if (!validNodes.length) return;

    const svg = d3.select(svgRef.current).attr("cursor", "grab");
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("class", "zoom-group");

    const allCities = new Set();
validNodes.forEach((node) => {
  if (node.cities)
    Object.keys(node.cities).forEach((c) => allCities.add(c));
});
const cityList = Array.from(allCities);

// 用來儲存已生成的顏色
const usedColors = new Set();

// 使用自訂的 oklch 顏色生成邏輯
const cityColorScale = d3
  .scaleOrdinal()
  .domain(cityList)
  .range(
    cityList.map(() => {
      let color;

      // 確保顏色是唯一的，直到生成不重複的顏色
      do {
        // 生成隨機的 oklch 顏色
        const L = 0.1 + Math.random() * 0.2;  // 隨機亮度，範圍從 0.4 到 0.6
        const C = 0.1 + Math.random() * 0.8;  // 隨機色度，範圍從 0.2 到 0.5
        const H = ( 0.1 + Math.random() * 1.8 ) * Math.PI;  // 隨機色相，範圍 0 到 2π

        // 轉換為 RGB 顏色
        const { r, g, b } = oklchToRgb(L, C, H);
        
        // 生成 RGB 顏色的字串
        color = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

      } while (usedColors.has(color));  // 如果顏色已經使用過，重新生成

      // 記錄顏色
      usedColors.add(color);

      // 返回顏色
      return color;
    })
  );

// 將顏色映射儲存到 cityColorMap 中
const cityColorMap = {};
cityList.forEach((city) => (cityColorMap[city] = cityColorScale(city)));
setCityColors(cityColorMap);

    // 群組顏色 + 節點半徑
    const groupIds = Array.from(new Set(validNodes.map((d) => d.groupId)));
    const groupColorScale = d3
      .scaleOrdinal(d3.schemeTableau10)
      .domain(groupIds);
    const maxCount = d3.max(validNodes, (d) => d.count);
    const r = d3
      .scaleSqrt()
      .domain([1, maxCount || 1])
      .range([10 * scaleFactor, 30 * scaleFactor]); // 半徑隨 scaleFactor 改變

    // ⚡ 隨機初始位置，避免所有節點一開始擠在中心
    data.nodes.forEach((d) => {
      d.x = Math.random() * width;
      d.y = Math.random() * height;
    });

    // 力導向模擬
    const sim = d3
      .forceSimulation(data.nodes)
      .force(
        "link",
        d3
          .forceLink(data.edges)
          .id((d) => d.id)
          .distance((d) => {
            if (d.source.groupId === d.target.groupId) return 25 * scaleFactor;

            let value = 50 + d.distance * 50;
            if (value > 400) value = 400;
            return value * scaleFactor;
          })
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide().radius((d) => r(d.count) + 2 * scaleFactor)
      );

    // 繪製邊線與距離文字
    const linkGroup = g.append("g").attr("class", "links");
    linkGroup
      .selectAll("line")
      .data(data.edges)
      .join("line")
      .attr("stroke", (d) => d.color || "var(--primary)")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d) =>
        d.style === "dotted" ? "2,2" : null
      )
      .attr("stroke-linecap", "round");

    const edgeLabels = linkGroup
      .selectAll("text")
      .data(data.edges)
      .join("text")
      .text((d) => d.distance)
      .attr("font-size", 10)
      .attr("fill", "var(--primary)")
      .attr("text-anchor", "middle");

    // 節點群組
    const node = g
      .append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(
        d3
          .drag()
          .on("start", (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = d.fy = null;
          })
      );

    // 繪製節點圓餅圖
    const pie = d3.pie().value(([_, value]) => value);
    const arc = d3.arc();

    node.each(function (d) {
      const group = d3.select(this);
      const radius = r(d.count);
      const entries = d.cities ? Object.entries(d.cities) : [];

      const borderWidth = d.isRepresentative ? 1 : 1;

      if (!entries.length) {
        group
          .append("circle")
          .attr("r", radius)
          .attr("fill", "var(--muted-foreground)")
          .attr("stroke", "var(--primary)")
          .attr("stroke-width", borderWidth);
        return;
      }

      const arcs = pie(entries);
      group
        .selectAll("path")
        .data(arcs)
        .join("path")
        .attr("d", arc.innerRadius(0).outerRadius(radius))
        .attr(
          "fill",
          (arcData) => cityColorMap[arcData.data[0]] || "var(--muted-foreground)"
        )
        .attr("stroke", "var(--primary)")
        .attr("stroke-width", borderWidth);
    });

    // tooltip 與 label
    node
      .append("title")
      .text(
        (d) =>
          `ID: ${d.id}\nCount: ${d.count}\n${Object.entries(
            d.cities || {}
          )
            .map(([c, n]) => `${c}: ${n}`)
            .join("\n")}`
      );

    node
      .append("text")
      .text((d) => d.id)
      .attr("y", (d) => -r(d.count) - 5)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--primary)")
      .attr("stroke", "var(--primary)")
      .attr("stroke-width", 0.5)
      .attr("font-size", 12);

    // tick 更新圖形位置
    sim.on("tick", () => {
      g.selectAll("line")
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      edgeLabels
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2);

      node.attr("transform", (d) => {
        // 限制節點位置不超出邊界
        d.x = Math.max(r(d.count), Math.min(width - r(d.count), d.x));
        d.y = Math.max(r(d.count), Math.min(height - r(d.count), d.y));

        return `translate(${d.x},${d.y})`;
      });
    });
  }, [data, width, height, scaleFactor, cityColorMap]); // scaleFactor 改變時重新渲染


  // 手動縮放控制
  const handleResize = (dir) => {
    setScaleFactor((prev) => {
      const next = dir === "in" ? prev * 1.2 : prev * 0.8;
      return Math.max(0.2, Math.min(5, next)); // 限制縮放範圍
    });
  };

  const handleMinChange = (e) => {
    const value = +e.target.value;
    if (value >= 0 && value <= fetchedRange.max) {
      setCountRange((prev) => ({ ...prev, min: value }));
    }
  };

  const handleMaxChange = (e) => {
    const value = +e.target.value;
    if (value >= countRange.min && value <= fetchedRange.max) {
      setCountRange((prev) => ({ ...prev, max: value }));
    }
  };

  const handleMaxBlur = () => {
    if (countRange.max < countRange.min) {
      setCountRange({ ...countRange, max: countRange.min });
    }
  };

  useEffect(() => {
    if (data && !loading) {
      const isAllConfigured = data.nodes && data.nodes.length > 0 && data.edges && data.edges.length > 0;
      setIsConfigured(isAllConfigured);
    }
  }, [data, loading]);

const exportPNG = async () => {
  // 确保 SVG 容器和城市图例都存在
  const svgContainer = svgRef.current;
  const legendContainer = document.querySelector(".HaplotypeNetwork-svg-container");
  if (!svgContainer || !legendContainer) return;

  const html2canvas = (await import("html2canvas")).default;

  try {
    // 创建一个 canvas 用来存储最终图像
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // 使用 canvg 渲染 SVG 到 canvas
    const v = await Canvg.from(ctx, svgContainer.outerHTML);
    await v.render(); // 渲染 SVG 图形

    // 使用 html2canvas 渲染城市图例到 canvas
    const legendCanvas = await html2canvas(legendContainer, {
      ignoreElements: (el) => el.tagName === "IFRAME",  // 忽略 iframe 元素
    });

    if (!legendCanvas) {
      console.error("Failed to capture legend content");
      return;
    }

    // 定义一些常数
    const padding = 10;
    const fontSize = 16;
    const boxSize = 14;
    const spacing = 6;
    const font = `${fontSize}px sans-serif`;
    const itemsPerColumn = 30;

    // 构建图例项目
    const legendItems = Object.entries(cityColors).map(([city, color]) => ({
      name: city,
      color: color || "block", // 默认颜色为 "block" (如果没有颜色)
    }));

    // 计算图例宽度与高度
    const numCols = Math.ceil(legendItems.length / itemsPerColumn);
    const numRows = Math.min(legendItems.length, itemsPerColumn);
    const legendWidth = 180 * numCols + padding;  // 图例区域宽度
    const legendHeight = padding * 2 + numRows * (fontSize + spacing);  // 图例区域高度

    // 调整 canvas 的宽高
    canvas.width = Math.max(svgContainer.width.baseVal.value, legendWidth) + + legendWidth;  // 取最大宽度
    canvas.height = svgContainer.height.baseVal.value ;  // 高度为图表 + 图例

    // 清空画布并填充白色背景
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 将 SVG 图形绘制到画布上
    ctx.drawImage(legendCanvas, 0, 0); // 绘制 SVG 图形


    // 绘制图例
    ctx.font = font;
    ctx.textBaseline = "middle";

    legendItems.forEach((item, i) => {
      const col = Math.floor(i / itemsPerColumn);
      const row = i % itemsPerColumn;
      const x = svgContainer.width.baseVal.value + col * 180 + padding ;
      const y = padding + row * (fontSize + spacing) + fontSize / 2;

      // 画颜色框
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(x + boxSize / 2, y, boxSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // 写城市名
      ctx.fillStyle = "black";
      ctx.fillText(item.name, x + boxSize + 8, y);
    });

    // 3. 将画布内容转换为 PNG 并下载
    canvas.toBlob((blob) => {
      if (blob) saveAs(blob, "haplotype_network_with_legend.png"); // 使用固定文件名
    });

  } catch (error) {
    console.error("Error during export:", error);
  }
};

  return (
    <div className="HaplotypeNetwork-container">
     
      <button
          className={`HaplotypeNetwork-button`}
          onClick={exportPNG} // Export button
        >
          Export as PNG
        </button>
          <div>
            <h2 className="HaplotypeNetwork-title">Haplotype Network</h2>
            <div style={{ marginBottom: 10 }}>
              {/* 城市圖例 *
              <button
                className={`HaplotypeNetwork-button ${apiPath === "HaplotypeNetwork" ? "active" : ""}`}
                onClick={() => setApiPath("HaplotypeNetwork")}
              >
                All information
              </button>
              <button
                className={`HaplotypeNetwork-button ${apiPath === "SimplifiedHaplotypeNetwork" ? "active" : ""}`}
                onClick={() => setApiPath("SimplifiedHaplotypeNetwork")}
              >
                reduce
              </button>
              */}
              <button
                className="HaplotypeNetwork-button HaplotypeNetwork-zoom-button"
                onClick={() => handleResize("in")}
              >
                🔍 zoom in
              </button>
              <button
                className="HaplotypeNetwork-button HaplotypeNetwork-zoom-out-button"
                onClick={() => handleResize("out")}
              >
                🔎 zoom out
              </button>

              <div>
                <label>Count range:</label>
                <input
                  type="number"
                  value={countRange.min}
                  onChange={handleMinChange}
                  min="0"
                  max={fetchedRange.max} // 控制最小值範圍
                />
                <span> to </span>
                <input
                  type="number"
                  value={countRange.max}
                  onChange={handleMaxChange}
                  max={fetchedRange.max} // 控制最大值範圍
                  onBlur={handleMaxBlur}
                />
                ({fetchedRange.min} - {fetchedRange.max})
              </div>
            </div>

                {!isConfigured && (
                  <div className="MapMainView-warning-box"> 
                      {(!data  || 
                        (Object.keys(data).length === 0) || 
                        (data.nodes && data.nodes.length === 0) || 
                        (data.edges && data.edges.length === 0) ) && (
                          <p> ⚠️ Complete the following settings：</p>
                      )}
                    <ul>
                      {(!data || 
                        (Object.keys(data).length === 0) || 
                        (data.nodes && data.nodes.length === 0) || 
                        (data.edges && data.edges.length === 0) ) && (
                          <li> Enter FA_table(Set the values ​​in the table)</li>
                      )}
                    </ul>
                  </div>
                )}
              <div className="HaplotypeNetwork-svg-container">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${width} ${height}`}
                  width={width}
                  height={height}
                /> 
              </div>
          </div>
          {/* 城市圖例 */}
          {Object.keys(cityColors).length > 0 && (
            <div className="HaplotypeNetwork-city-legend">
              <h3>Location</h3>
              <div>
                <ul className="HaplotypeNetwork-city-list">
                  {Object.entries(cityColors).map(([city, color]) => (
                    <li key={city} className="HaplotypeNetwork-city-item">
                      <div
                        className="HaplotypeNetwork-city-color-box"
                        style={{ backgroundColor: color }}
                      />
                      {city}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
    </div>
  );
};

export default HaplotypeNetwork;