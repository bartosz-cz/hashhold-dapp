// AlgaeField.tsx
import React, { useMemo } from "react";

type Props = {
  stems?: number; // ile liści
  segments?: number; // segmentów (im więcej, tym gładszy kontur)
  width?: number; // maksymalna szerokość liścia
  height?: number; // maksymalna wysokość liścia
  light?: string; // jaśniejszy szary
  dark?: string; // ciemniejszy szary
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Główna funkcja generująca punkty dwóch krawędzi jednego liścia */
function generateLeaf(
  segments: number,
  width: number,
  height: number,
  phase = 0
) {
  const left: [number, number][] = [];
  const right: [number, number][] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * height;
    const amp = width * 0.5 * (1 - t); // zwężanie ku górze
    const offset = Math.sin(i * 0.9 + phase) * amp;
    left.push([offset, y]);
    right.unshift([-offset, y]); // prawa krawędź budujemy od dołu
  }

  return [...left, ...right];
}

export default function Algae({
  stems = 5,
  segments = 18,
  width = 60,
  height = 360,
  light = "#a0a0a0",
  dark = "#4b4b4b",
}: Props) {
  /* 1️⃣ raz przelicz kształty, żeby nie losowały się przy każdym renderze */
  const leaves = useMemo(() => {
    const arr: {
      d: string;
      gradId: string;
      translateX: number;
      translateY: number;
      shadowSide: "left" | "right";
    }[] = [];

    for (let i = 0; i < stems; i++) {
      const pts = generateLeaf(segments, width, height, i);
      const d = pts
        .map(
          ([x, y], idx) => `${idx ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`
        )
        .join(" ")
        .concat(" Z");

      arr.push({
        d,
        gradId: `leafGrad${i}`,
        translateX: i * (width + 50),
        translateY: rand(10, 40),
        shadowSide: i % 2 === 0 ? "left" : "right",
      });
    }
    return arr;
  }, [stems, segments, width, height]);

  /* 2️⃣ SVG */
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${stems * (width + 50)} ${height}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        {/* filtr drop-shadow jeden wspólny  */}
        <filter id="leafShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="4"
            floodOpacity="0.35"
            floodColor="#000"
          />
        </filter>

        {/* gradieny liści – każdy własny ID */}
        {leaves.map(({ gradId }) => (
          <linearGradient key={gradId} id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={light} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>
        ))}
      </defs>

      {/* rysowanie liści */}
      {leaves.map(({ d, gradId, translateX, translateY, shadowSide }) => (
        <g
          key={gradId}
          transform={`translate(${translateX} ${translateY})`}
          filter="url(#leafShadow)"
        >
          <path
            d={d}
            fill={`url(#${gradId})`}
            stroke="#000"
            strokeWidth="1"
            strokeOpacity="0.15"
            style={{
              /* cień tylko z jednej strony: maskujemy dropp-shadow */
              filter: `drop-shadow(${
                shadowSide === "left" ? "-" : ""
              }6px 4px 6px rgba(0,0,0,.35))`,
            }}
          />
        </g>
      ))}
    </svg>
  );
}
