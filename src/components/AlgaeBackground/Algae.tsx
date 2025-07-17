// Algae.tsx
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  maxHeight?: number;
  minHeightPct?: number;
  maxWidth?: number;
  gapMin?: number;
  gapMax?: number;
  light?: string;
  dark?: string;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/* generowanie jednej łodygi */
function makeLeaf(
  segments: number,
  w: number,
  h: number,
  phase = 0
): [number, number][] {
  const L: [number, number][] = [];
  const R: [number, number][] = [];

  /* iterate only to segments-1  ──────────────────────────── */
  for (let i = 0; i < segments; i++) {
    //  ←  strictly <
    const t = i / segments; //   0 … <1
    const y = h - t * h; //   draw from bottom

    const taper = 1 - t;
    const amp = Math.max(
      w * 0.5 * taper * (0.7 + 0.6 * rand(0, 1) * taper),
      15 // minimal width
    );
    const x = Math.sin(i * 0.9 + phase) * amp;

    L.push([x, y]);
    R.unshift([-x, y]);
  }

  /* one centred tip so both edges meet in a point */
  const tip: [number, number] = [0, 0]; //  topmost y = 0
  L.push(tip);
  R.unshift(tip);

  return [...L, ...R]; // ready for SVG path
}
export default function Algae({
  maxHeight = 1000,
  minHeightPct = 0.7,
  maxWidth = 250,
  gapMin = 80,
  gapMax = 220,
  light = "#743AC3",
  dark = "#2A2A2A",
}: Props) {
  /* szerokość ekranu → liczba łodyg */
  const [vw, setVw] = useState(() => window.innerWidth);
  useEffect(() => {
    const f = () => setVw(window.innerWidth);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  const stems = Math.ceil(vw / ((gapMin + gapMax) / 2));

  /* generujemy tylko raz na zmianę konfiguracji */
  const leaves = useMemo(() => {
    let x = 0;
    return Array.from({ length: stems }).map((_, i) => {
      const h = rand(minHeightPct, 1) * maxHeight * 0.95;
      const w = rand(maxWidth * 0.6, maxWidth);
      const seg = Math.max(12, Math.round(h / 40));
      const phase = rand(0, Math.PI * 2);

      const d =
        makeLeaf(seg, w, h, phase)
          .map(
            ([X, Y], idx) => `${idx ? "L" : "M"}${X.toFixed(1)},${Y.toFixed(1)}`
          )
          .join(" ") + " Z";

      const leaf = {
        d,
        h,
        xMid: x + w / 2,
        gradId: `g${i}`,
        side: i % 2 ? "left" : "right",
      };
      x += rand(gapMin, gapMax) + w;
      return leaf;
    });
  }, [stems, maxHeight, maxWidth, gapMin, gapMax, minHeightPct]);

  const viewW = leaves.length ? leaves.at(-1)!.xMid + maxWidth : vw;

  /* ---------- RENDER ---------- */
  return (
    <svg
      width="100%"
      height={maxHeight}
      viewBox={`0 0 ${viewW} ${-maxHeight}`}
      style={{
        position: "absolute",
        inset: 0,

        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <defs>
        <filter id="shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dy="4" stdDeviation="4" floodOpacity="0.35" />
        </filter>

        {leaves.map(({ gradId }) => (
          <linearGradient key={gradId} id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={"rgb(49, 25, 83)"} />

            <stop offset="90%" stopColor={"#2A2A2A"} />
          </linearGradient>
        ))}
      </defs>

      {leaves.map(({ d, gradId, xMid, h, side }) => (
        <g
          key={gradId}
          transform={`translate(${xMid} ${maxHeight - h})`} /* ⬅ bazuje na h */
          filter="url(#shadow)"
        >
          <path
            d={d}
            fill={`url(#${gradId})`}
            stroke="#000"
            strokeWidth={1}
            strokeOpacity={0.12}
            style={{
              filter: `drop-shadow(${
                side === "left" ? "-" : ""
              }5px 3px 5px rgba(0,0,0,.35))`,
            }}
          />
        </g>
      ))}
    </svg>
  );
}
