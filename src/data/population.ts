/** Normaliza población legacy (string) o numérica a entero ≥ 0. */
export function parsePopulationToInt(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }

  let s = String(value)
    .trim()
    .toLowerCase()
    .replace(/~/g, "")
    .replace(/ó/g, "o")
    .replace(/á/g, "a")
    .replace(/í/g, "i")
    .replace(/é/g, "e")
    .replace(/ú/g, "u")
    .replace(/\s+/g, " ");

  if (!s) return 0;

  const compact = s.match(/^([\d][\d.,]*)\s*([kmb])$/i);
  if (compact) {
    const n = parseNumericToken(compact[1]);
    const mult = { k: 1_000, m: 1_000_000, b: 1_000_000_000 }[compact[2].toLowerCase() as "k"]!;
    return Math.round(n * mult);
  }

  const plain = parsePlainNumber(s);
  if (plain !== null && !/[a-z]/.test(s.replace(/[0-9.,\s]/g, ""))) {
    return Math.round(Math.max(0, plain));
  }

  const numMatch = s.match(/^([\d][\d.,]*)/);
  if (!numMatch) return 0;

  let n = parseNumericToken(numMatch[1]);
  let rest = s.slice(numMatch[0].length).trim();

  while (rest.length > 0) {
    if (rest.startsWith("mil millon")) {
      n *= 1_000_000_000;
      rest = rest.replace(/^mil\s+millon(es)?\s*/, "").trim();
      continue;
    }
    if (rest.startsWith("billon")) {
      n *= 1_000_000_000_000;
      rest = rest.replace(/^billon(es)?\s*/, "").trim();
      continue;
    }
    if (rest.startsWith("millon")) {
      n *= 1_000_000;
      rest = rest.replace(/^millon(es)?\s*/, "").trim();
      continue;
    }
    if (/^[kmb]\b/.test(rest)) {
      const u = rest[0] as "k" | "m" | "b";
      n *= { k: 1_000, m: 1_000_000, b: 1_000_000_000 }[u];
      rest = rest.slice(1).trim();
      continue;
    }
    if (rest.startsWith("mil")) {
      n *= 1_000;
      rest = rest.replace(/^mil\s*/, "").trim();
      continue;
    }
    break;
  }

  return Math.round(Math.max(0, n));
}

/** Separador de miles con punto: 300000 → "300.000" */
export function formatNumberWithDots(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const rounded = Math.round(Math.max(0, n));
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Vista legible: K / M / B / T o número con puntos si es chico. */
export function formatPopulation(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";

  if (n >= 1_000_000_000_000) return formatCompactSuffix(n, 1_000_000_000_000, "T");
  if (n >= 1_000_000_000) return formatCompactSuffix(n, 1_000_000_000, "B");
  if (n >= 1_000_000) return formatCompactSuffix(n, 1_000_000, "M");
  if (n >= 10_000) return formatCompactSuffix(n, 1_000, "K");

  return formatNumberWithDots(n);
}

function formatCompactSuffix(n: number, divisor: number, suffix: string): string {
  const v = n / divisor;
  const rounded = Math.round(v * 10) / 10;
  const isWhole = Math.abs(rounded - Math.round(rounded)) < 0.05;

  if (isWhole || rounded >= 100) {
    return `${formatNumberWithDots(Math.round(rounded))} ${suffix}`;
  }

  const decimal = rounded.toFixed(1).replace(".", ",");
  return `${decimal} ${suffix}`;
}

function parsePlainNumber(s: string): number | null {
  const t = s.replace(/\s/g, "");
  if (/^\d+$/.test(t)) return parseFloat(t);
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) {
    return parseFloat(t.replace(/,/g, ""));
  }
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) {
    return parseFloat(t.replace(/\./g, "").replace(",", "."));
  }
  if (/^[\d.,]+$/.test(t)) {
    return parseNumericToken(t);
  }
  return null;
}

function parseNumericToken(token: string): number {
  const t = token.trim();
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) {
    return parseFloat(t.replace(/,/g, ""));
  }
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) {
    return parseFloat(t.replace(/\./g, "").replace(",", "."));
  }
  const n = parseFloat(t.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
