import { useState } from "react";
import { ChartTooltip } from "./ChartTooltip.jsx";

// Tiny line chart with hover tracking. `fill` paints the area under the line.

export function Sparkline({ data, width = 180, height = 44, fill = true, labels, valueFmt = (v) => v }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...data, 1);
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${height - (v / max) * (height - 4) - 2}`).join(" ");
  return (
    <div className="relative inline-block" onMouseLeave={() => setHover(null)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - r.left;
          const i = Math.max(0, Math.min(data.length - 1, Math.round(x / step)));
          setHover(i);
        }}
      >
        {fill && <polygon points={`0,${height} ${pts} ${width},${height}`} fill="var(--accent-soft)" />}
        <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
        {hover !== null && (
          <g>
            <line
              x1={hover * step}
              x2={hover * step}
              y1={0}
              y2={height}
              stroke="var(--ink)"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.4"
            />
            <circle
              cx={hover * step}
              cy={height - (data[hover] / max) * (height - 4) - 2}
              r="3"
              fill="var(--accent)"
              stroke="#fff"
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>
      {hover !== null && (
        <ChartTooltip
          x={hover * step}
          y={height - (data[hover] / max) * (height - 4) - 2}
          label={labels ? labels[hover] : `#${hover + 1}`}
          value={valueFmt(data[hover])}
        />
      )}
    </div>
  );
}
