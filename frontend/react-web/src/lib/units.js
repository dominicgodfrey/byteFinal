// Mirrors the mobile app. Fallback until loaded.

export const FALLBACK_UNITS = [
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

export const toMap = (units) => Object.fromEntries(units.map((u) => [u.key, u]));

export function convert(quantity, from, to, units) {
  const a = units[from];
  const b = units[to];

  if (!a || !b) throw new Error("Unknown unit");
  if (a.dim !== b.dim) throw new Error(`Can't convert ${a.dim} to ${b.dim}`);

  return (quantity * a.toBase) / b.toBase;
}

const FRACTIONS = [
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

const trimZeros = (s) => s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");

/** 0.333 becomes "⅓", 1.5 becomes "1½". */
export function formatQuantity(q) {
  if (!Number.isFinite(q) || q <= 0) return "0";
  if (q >= 10) return trimZeros((Math.round(q * 10) / 10).toFixed(1));

  const whole = Math.floor(q);
  const frac = q - whole;

  let best = FRACTIONS[0];
  let bestDiff = Infinity;

  for (const f of FRACTIONS) {
    const d = Math.abs(frac - f[0]);
    if (d < bestDiff) {
      bestDiff = d;
      best = f;
    }
  }

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

const DOWNSHIFT = {
  gallon: "quart",
  quart: "pint",
  pint: "cup",
  cup: "tbsp",
  tbsp: "tsp",
  l: "ml",
  kg: "g",
  lb: "oz",
};

export function prettyAmount(quantity, unit, units) {
  let q = quantity;
  let u = unit;
  let guard = 0;

  while (q < 1 && DOWNSHIFT[u] && units[u] && units[DOWNSHIFT[u]] && guard++ < 3) {
    const next = DOWNSHIFT[u];
    q = convert(q, u, next, units);
    u = next;
  }

  return `${formatQuantity(q)} ${units[u]?.label ?? u}`;
}

/** Stored per serving, so scaling is multiplication. */
export const scaleIngredients = (ingredients, servings) =>
  ingredients.map((i) => ({ ...i, quantity: i.quantity * servings }));
