import { useState } from "react";

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startDeg, endDeg) {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const sweep = endDeg - startDeg;
  const large = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export default function GaugeChart({
  value = 78,
  subtitle = "Ejecutados vs Programados",
  size = 220,
  strokeWidth = 18,
}) {
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = (size - 40) / 2;
  const [hovered, setHovered] = useState(false);

  const angle = (value / 100) * 180;
  const bgArc = describeArc(cx, cy, r, 0, 180);
  const valArc = describeArc(cx, cy, r, 0, angle);

  const needleLen = r * 0.75;
  const needleAngle = angle;
  const needleEnd = polarToCartesian(cx, cy, needleLen, needleAngle);

  const color = value >= 80 ? "#059669" : value >= 60 ? "#d97706" : "#dc2626";

  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size / 2 + 30}
        viewBox={`0 0 ${size} ${size / 2 + 30}`}
        className="overflow-visible"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="gaugeShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        <path d={bgArc} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} strokeLinecap="round" />

        <path
          d={valArc}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            filter: hovered ? "drop-shadow(0 0 6px rgba(5, 150, 105, 0.4))" : "none",
            transition: "filter 0.3s ease",
          }}
        />

        <line
          x1={cx}
          y1={cy}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          filter="url(#gaugeShadow)"
        />

        <circle cx={cx} cy={cy} r={8} fill="white" stroke={color} strokeWidth={3} filter="url(#gaugeShadow)" />
        <circle cx={cx} cy={cy} r={3} fill={color} />

        <text x={cx} y={cy + 30} textAnchor="middle" className="text-2xl font-bold" fill="#1e293b" fontSize="28" fontWeight="700">
          {value}%
        </text>
      </svg>
      <div className="mt-2 text-center">
        <p className="text-xs font-medium text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}
