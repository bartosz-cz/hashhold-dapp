import { useEffect, useRef, useState } from "react";
import styles from "./BubbleBackground.module.css";
import { AVAILABLE_TOKENS } from "../../config/supportedTokens";
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

type BubbleBackgroundProps = {
  lastStakes: any[];
};

const BubbleBackground: React.FC<BubbleBackgroundProps> = ({ lastStakes }) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const visible = useRef(true);
  const stakeIdx = useRef(0);

  const SECTORS = 8;
  const getSector = (leftPct: number) =>
    Math.min(SECTORS - 1, Math.floor(leftPct / (100 / SECTORS)));
  function sectorLoad(container: HTMLDivElement): number[] {
    const load = Array(SECTORS).fill(0);
    container
      .querySelectorAll<HTMLElement>("." + styles.bubble)
      .forEach((el) => {
        const x = parseFloat(el.style.getPropertyValue("--startLeft"));
        load[getSector(x)]++;
      });
    return load;
  }

  // Modified spawn to use next stake from lastStakes
  const spawn = () => {
    if (!visible.current || !rootRef.current) return;
    if (!lastStakes.length) return;

    // === Get next stake (cycle through or clamp at end) ===
    const idx = stakeIdx.current % lastStakes.length;
    const stake = lastStakes[idx];
    stakeIdx.current++;

    // Find token (match as you store it)
    const token =
      AVAILABLE_TOKENS.find(
        (t) =>
          t.address === stake.tokenId ||
          t.name === stake.symbol ||
          t.address === stake.tokenId
      ) || AVAILABLE_TOKENS[0];

    // Amount (adjust as needed, maybe parseFloat/stake.amount if BigNumber)

    const amount = Number(stake.amount || stake.value || 0);

    // --- create bubble ---
    const span = document.createElement("span");
    span.className = styles.bubble;
    span.innerHTML = `
      <img class="${styles.icon}" src="${token.thumb}" alt="${token.name}" />
      <span class="${styles.amount}">${formatCompact(amount)}</span>
    `;

    // All the rest stays random!
    const size = amountToSize(amount);
    const containerWidth = rootRef.current.offsetWidth;
    const sizePercent = (size / containerWidth) * 100;
    const marginPercent = sizePercent / 2;

    // random sector
    const load = sectorLoad(rootRef.current);
    const minLoad = Math.min(...load);
    const candidates = load
      .map((cnt, idx) => (cnt === minLoad ? idx : -1))
      .filter((i) => i >= 0);
    const sector = candidates[Math.floor(rand(0, candidates.length))];

    const sectorW = 100 / SECTORS;
    const sectorMin = sector * sectorW + marginPercent;
    const sectorMax = (sector + 1) * sectorW - marginPercent;
    const startLeft = rand(sectorMin, sectorMax);

    const curve = rand(-20, 20);
    const endLeft = Math.max(
      marginPercent,
      Math.min(100 - marginPercent, startLeft + curve)
    );

    span.style.setProperty("--size", `${size}px`);
    span.style.setProperty("--fontSize", `${size * 0.18}px`);
    span.style.setProperty("--startLeft", `${startLeft}%`);
    span.style.setProperty("--endLeft", `${endLeft}%`);
    span.style.setProperty("--riseDur", `${rand(12, 20)}s`);
    span.style.setProperty("--endScale", `${rand(1.1, 1.3)}`);

    // random color as before
    const hue = rand(260, 275);
    span.style.setProperty("--bubbleColor", `hsl(${hue} 60% 55%)`);

    rootRef.current.appendChild(span);
    span.addEventListener("animationend", () => span.remove(), { once: true });

    // schedule next bubble as before
    timerRef.current = setTimeout(spawn, rand(1500, 3500));
  };

  useEffect(() => {
    stakeIdx.current = 0; // start from the beginning on array change
    spawn();

    const visHandler = () => {
      visible.current = document.visibilityState === "visible";
      if (!visible.current && timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      } else if (visible.current && !timerRef.current) {
        spawn();
      }
    };
    document.addEventListener("visibilitychange", visHandler);

    return () => {
      document.removeEventListener("visibilitychange", visHandler);
      if (timerRef.current) clearTimeout(timerRef.current);
      rootRef.current?.replaceChildren();
    };
  }, [lastStakes]); // re-run on stakes change!

  return <div ref={rootRef} className={styles.bubbleRoot} />;
};

const formatCompact = (value: number): string => {
  if (value === 0) return "0.0000";

  const abs = Math.abs(value);
  let suffix = "";
  let divider = 1;

  if (abs >= 1e9) {
    suffix = "B";
    divider = 1e9;
  } else if (abs >= 1e6) {
    suffix = "M";
    divider = 1e6;
  } else if (abs >= 1e3) {
    suffix = "k";
    divider = 1e3;
  }

  const shortVal = value / divider;

  const maxDigits = 5;
  const integerPart = Math.floor(Math.abs(shortVal)).toString();
  let decimalPlaces = Math.max(0, maxDigits - integerPart.length);

  let result = shortVal.toFixed(decimalPlaces);

  // Jeśli mimo to przekracza 5 cyfr (bez przecinka), zmniejsz precyzję
  while (result.replace(".", "").length > maxDigits && decimalPlaces > 0) {
    decimalPlaces--;
    result = shortVal.toFixed(decimalPlaces);
  }

  // Dodaj sufiks jeśli trzeba
  return result + suffix;
};

/** Przekształca kwotę tokenów w piksele koła. */
function amountToSize(
  amount: number,
  {
    minSize = 48, // px przy 1 tokenie
    maxSize = 200, // px przy 1 mln (lub więcej)
    maxLog = 6, // log₁₀(1 000 000) = 6
  } = {}
): number {
  const log = Math.log10(Math.max(1, amount)); // log₁₀(kwoty)
  const t = Math.min(1, log / maxLog); // 0-1 w zakresie [1 .. 10^maxLog]
  return minSize + t * (maxSize - minSize);
}

export default BubbleBackground;
