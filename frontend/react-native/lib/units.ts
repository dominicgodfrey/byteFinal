// Conversion plus the formatting that makes amounts cookable.

export type Dim = "volume" | "mass" | "count";

export type Unit = {
  key: string;
  label: string;
  dim: Dim;
  toBase: number;
};

// Fallback only. UnitsContext caches the real table.
export const FALLBACK_UNITS: Unit[] = [
  { key: "pinch", label: "pinch", dim: "volume", toBase: 0.31 },
  { key: "tsp", label: "tsp", dim: "volume", toBase: 4.92892 },
  { key: "tbsp", label: "tbsp", dim: "volume", toBase: 14.7868 },
  { key: "floz", label: "fl oz", dim: "volume", toBase: 29.5735 },
  { key: "cup", label: "cup", dim: "volume", toBase: 236.588 },
  { key: "pint", label: "pint", dim: "volume", toBase: 473.176 },
  { key: "quart", label: "quart", dim: "volume", toBase: 946.353 },
  { key: "gallon", label: "gallon", dim: "volume", toBase: 3785.41 },
  { key: "ml", label: "ml", dim: "volume", toBase: 1 },
  { key: "l", label: "L", dim: "volume", toBase: 1000 },
  { key: "g", label: "g", dim: "mass", toBase: 1 },
  { key: "kg", label: "kg", dim: "mass", toBase: 1000 },
  { key: "oz", label: "oz", dim: "mass", toBase: 28.3495 },
  { key: "lb", label: "lb", dim: "mass", toBase: 453.592 },
  { key: "piece", label: "piece", dim: "count", toBase: 1 },
  { key: "clove", label: "clove", dim: "count", toBase: 1 },
  { key: "slice", label: "slice", dim: "count", toBase: 1 },
];

export function toMap(units: Unit[]): Record<string, Unit> {
  return Object.fromEntries(units.map((u) => [u.key, u]));
}

export function convert(
  quantity: number,
  from: string,
  to: string,
  units: Record<string, Unit>
): number {
  const a = units[from];
  const b = units[to];

  if (!a || !b) throw new Error("Unknown unit");
  if (a.dim !== b.dim) throw new Error(`Can't convert ${a.dim} to ${b.dim}`);

  return (quantity * a.toBase) / b.toBase;
}

// Fractions a kitchen actually uses.
const FRACTIONS: Array<[number, string]> = [
  [0, ""],
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [3 / 8, "⅜"],
  [1 / 2, "½"],
  [5 / 8, "⅝"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [7 / 8, "⅞"],
  [1, ""],
];

const trimZeros = (s: string) => s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");

/** 0.333 -> "⅓", 1.5 -> "1½", 250 -> "250", 12.47 -> "12.5" */
export function formatQuantity(q: number): string {
  if (!Number.isFinite(q) || q <= 0) return "0";

  // Past this size fractions stop helping.
  if (q >= 10) return trimZeros((Math.round(q * 10) / 10).toFixed(1));

  const whole = Math.floor(q);
  const frac = q - whole;

  let best: [number, string] = FRACTIONS[0];
  let bestDiff = Infinity;

  for (const f of FRACTIONS) {
    const d = Math.abs(frac - f[0]);
    if (d < bestDiff) {
      bestDiff = d;
      best = f;
    }
  }

  // Not near a fraction, so show decimals.
  if (bestDiff > 0.035) return trimZeros(q.toFixed(q < 1 ? 2 : 1));

  let w = whole;
  let symbol = best[1];

  if (best[0] === 1) {
    w += 1;
    symbol = "";
  }

  if (!symbol) return String(w || (q < 0.005 ? 0 : Number(q.toFixed(2))));
  if (w === 0) return symbol;

  return `${w}${symbol}`;
}

// A third cup reads better as tablespoons.
const DOWNSHIFT: Record<string, string> = {
  gallon: "quart",
  quart: "pint",
  pint: "cup",
  cup: "tbsp",
  tbsp: "tsp",
  l: "ml",
  kg: "g",
  lb: "oz",
};

/** Picks the most readable unit, then formats it. */
export function prettyAmount(
  quantity: number,
  unit: string,
  units: Record<string, Unit>
): { quantity: number; unit: string; text: string } {
  let q = quantity;
  let u = unit;

  let guard = 0;
  while (q < 1 && DOWNSHIFT[u] && units[u] && units[DOWNSHIFT[u]] && guard++ < 3) {
    const next = DOWNSHIFT[u];
    q = convert(q, u, next, units);
    u = next;
  }

  const label = units[u]?.label ?? u;

  return { quantity: q, unit: u, text: `${formatQuantity(q)} ${label}` };
}

export type Ingredient = { name: string; quantity: number; unit: string };

/** Runs locally, so the stepper is instant offline. */
export function scaleIngredients(ingredients: Ingredient[], servings: number): Ingredient[] {
  return ingredients.map((i) => ({ ...i, quantity: i.quantity * servings }));
}
