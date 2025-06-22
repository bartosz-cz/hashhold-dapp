import { useEffect, useRef } from "react";
import styles from "./BubbleBackground.module.css";
import { AVAILABLE_TOKENS } from "../../config/supportedTokens";
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export default function BubbleBackground() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const visible = useRef(true); // kontrola visibility

  /** spawns a single bubble and schedules next one */
  /* losowe symbole; dodaj własne, jeśli trzeba */
  const SECTORS = 8; // ile pól w poprzek
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

  /** spawns a single bubble and schedules next one */
  const spawn = () => {
    if (!visible.current || !rootRef.current) return;

    /* === losujemy token i kwotę === */
    const token =
      AVAILABLE_TOKENS[Math.floor(rand(0, AVAILABLE_TOKENS.length))];
    const amount = Math.round(rand(10, 1_000));

    /* === element bańki === */
    const span = document.createElement("span");
    span.className = styles.bubble;
    span.innerHTML = `
    <img class="${styles.icon}" src="${token.thumb}" alt="${token.name}" />
    <span class="${styles.amount}">${formatCompact(amount)}</span>
  `;

    /* ── rozmiar zależny od kwoty ── */
    const size = amountToSize(amount);
    const containerWidth = rootRef.current.offsetWidth;
    const sizePercent = (size / containerWidth) * 100;

    /* ── pozycja & animacja ── */
    const marginPercent = sizePercent / 2;

    // wybierz sektor o najmniejszym obciążeniu
    const load = sectorLoad(rootRef.current);
    const minLoad = Math.min(...load);
    const candidates = load
      .map((cnt, idx) => (cnt === minLoad ? idx : -1))
      .filter((i) => i >= 0);
    const sector = candidates[Math.floor(rand(0, candidates.length))];

    // losowa pozycja wewnątrz sektora
    const sectorW = 100 / SECTORS;
    const sectorMin = sector * sectorW + marginPercent;
    const sectorMax = (sector + 1) * sectorW - marginPercent;
    const startLeft = rand(sectorMin, sectorMax);

    const curve = rand(-20, 20);
    const endLeft = Math.max(
      marginPercent,
      Math.min(100 - marginPercent, startLeft + curve)
    );

    /* ── zmienne CSS ── */
    span.style.setProperty("--size", `${size}px`);
    span.style.setProperty("--fontSize", `${size * 0.18}px`);
    span.style.setProperty("--startLeft", `${startLeft}%`);
    span.style.setProperty("--endLeft", `${endLeft}%`);
    span.style.setProperty("--riseDur", `${rand(12, 20)}s`);
    span.style.setProperty("--endScale", `${rand(1.1, 1.3)}`);

    /* kolor bańki */
    const hue = rand(260, 275);
    span.style.setProperty("--bubbleColor", `hsl(${hue} 60% 55%)`);

    /* dodajemy do DOM-u */
    rootRef.current.appendChild(span);

    /* sprzątamy po animacji */

    span.addEventListener("animationend", () => span.remove(), { once: true });

    /* plan kolejnej bańki */
    timerRef.current = setTimeout(spawn, rand(1500, 3500));
  };

  useEffect(() => {
    /* pierwsza bańka */
    spawn();

    /* pauza / wznowienie gdy karta niewidoczna */
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
  }, []);

  return <div ref={rootRef} className={styles.bubbleRoot} />;
}

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
