import { useState } from "react";

const departments = [
  { name: "Nueva Segovia", samples: 18, cx: 100, cy: 30 },
  { name: "Madriz", samples: 12, cx: 150, cy: 25 },
  { name: "Estelí", samples: 35, cx: 190, cy: 55 },
  { name: "Jinotega", samples: 28, cx: 260, cy: 45 },
  { name: "Chinandega", samples: 42, cx: 75, cy: 95 },
  { name: "León", samples: 55, cx: 120, cy: 110 },
  { name: "Matagalpa", samples: 45, cx: 250, cy: 105 },
  { name: "RAAN", samples: 22, cx: 340, cy: 80 },
  { name: "Managua", samples: 125, cx: 175, cy: 170 },
  { name: "Masaya", samples: 38, cx: 215, cy: 180 },
  { name: "Boaco", samples: 15, cx: 280, cy: 175 },
  { name: "RAAS", samples: 38, cx: 340, cy: 190 },
  { name: "Carazo", samples: 25, cx: 155, cy: 225 },
  { name: "Granada", samples: 52, cx: 200, cy: 240 },
  { name: "Chontales", samples: 30, cx: 270, cy: 240 },
  { name: "Rivas", samples: 32, cx: 145, cy: 280 },
  { name: "Río San Juan", samples: 10, cx: 250, cy: 305 },
];

const maxSamples = Math.max(...departments.map((d) => d.samples));
const minSamples = Math.min(...departments.map((d) => d.samples));

function getColor(samples) {
  const ratio = (samples - minSamples) / (maxSamples - minSamples);
  const r = Math.round(30 + ratio * (5 - 30));
  const g = Math.round(58 + ratio * (150 - 58));
  const b = Math.round(138 + ratio * (107 - 138));
  return `rgb(${r}, ${g}, ${b})`;
}

function getRadius(samples) {
  const ratio = (samples - minSamples) / (maxSamples - minSamples);
  return 14 + ratio * 18;
}

export default function NicaraguaMap() {
  const [tooltip, setTooltip] = useState(null);

  return (
    <div className="relative">
      <svg viewBox="0 0 400 350" className="h-auto w-full" style={{ minHeight: 280 }}>
        <defs>
          <filter id="mapShadow">
            <feDropShadow dx="1" dy="1" stdDeviation="2" floodOpacity="0.2" />
          </filter>
          <filter id="glow">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.4" />
          </filter>
          <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="400" height="350" fill="url(#bgGrad)" rx="8" />

        <path
          d="M 60,40 L 80,20 L 130,12 L 200,8 L 280,12 L 350,25 L 385,55 L 380,90 L 365,130 L 345,170 L 325,205 L 310,235 L 285,260 L 260,280 L 230,295 L 195,305 L 160,295 L 130,270 L 105,230 L 80,180 L 55,110 Z"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.6"
        />

        {departments.map((d) => {
          const r = getRadius(d.samples);
          const fill = getColor(d.samples);
          return (
            <g key={d.name}>
              <circle
                cx={d.cx}
                cy={d.cy}
                r={r}
                fill={fill}
                opacity="0.85"
                filter="url(#mapShadow)"
                style={{ cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={(e) => {
                  setTooltip({ name: d.name, samples: d.samples, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
              <circle cx={d.cx} cy={d.cy} r={r} fill="none" stroke="white" strokeWidth="1.5" opacity="0.6" />
              <text
                x={d.cx}
                y={d.cy + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize="9"
                fontWeight="600"
                style={{ pointerEvents: "none" }}
              >
                {d.samples}
              </text>
              <text
                x={d.cx}
                y={d.cy + r + 13}
                textAnchor="middle"
                fill="#475569"
                fontSize="8"
                fontWeight="500"
                style={{ pointerEvents: "none" }}
              >
                {d.name}
              </text>
            </g>
          );
        })}

        <rect x="14" y="318" width="12" height="10" rx="2" fill="rgb(30, 58, 138)" />
        <rect x="34" y="318" width="12" height="10" rx="2" fill="rgb(22, 90, 130)" />
        <rect x="54" y="318" width="12" height="10" rx="2" fill="rgb(14, 122, 122)" />
        <rect x="74" y="318" width="12" height="10" rx="2" fill="rgb(10, 150, 110)" />
        <text x="94" y="327" fill="#64748b" fontSize="8">Bajo</text>
        <text x="300" y="327" fill="#64748b" fontSize="8">Alto</text>
      </svg>

      {tooltip && (
        <div
          className="absolute z-10 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 30,
            pointerEvents: "none",
          }}
        >
          <p className="font-semibold">{tooltip.name}</p>
          <p className="text-gray-300">{tooltip.samples} muestras</p>
        </div>
      )}
    </div>
  );
}
