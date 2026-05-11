import { useState } from "react";
import { ChartTooltip } from "./ChartTooltip.jsx";

// Vertical bar chart with hover tracking. Active bar paints accent; others ink.

export function Bars({ data, width = 260, height = 60, gap = 2, labels, valueFmt = (v) => v.toLocaleString("es-PE") }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...data, 1);
  const bw = (width - (data.length - 1) * gap) / data.length;
  return (
    <div className="relative inline-block" onMouseLeave={() => setHover(null)}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        {data.map((v, i) => {
          const h = (v / max) * (height - 4);
          const active = hover === i;
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={i * (bw + gap)} y={0} width={bw} height={height} fill="transparent" />
              <rect
                x={i * (bw + gap)}
                y={height - h}
                width={bw}
                height={h}
                fill={active ? "var(--accent)" : "var(--ink)"}
                opacity={active ? 1 : 0.85}
              />
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <ChartTooltip
          x={hover * (bw + gap) + bw / 2}
          y={height - (data[hover] / max) * (height - 4)}
          label={labels ? labels[hover] : `#${hover + 1}`}
          value={valueFmt(data[hover])}
        />
      )}
    </div>
  );
}
