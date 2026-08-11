// Unit table. Bases: ml, g, each.

export const UNITS = {
  // volume (base: ml)
  pinch:  { dim: "volume", toBase: 0.31,    label: "pinch" },
  tsp:    { dim: "volume", toBase: 4.92892, label: "tsp" },
  tbsp:   { dim: "volume", toBase: 14.7868, label: "tbsp" },
  floz:   { dim: "volume", toBase: 29.5735, label: "fl oz" },
  cup:    { dim: "volume", toBase: 236.588, label: "cup" },
  pint:   { dim: "volume", toBase: 473.176, label: "pint" },
  quart:  { dim: "volume", toBase: 946.353, label: "quart" },
  gallon: { dim: "volume", toBase: 3785.41, label: "gallon" },
  ml:     { dim: "volume", toBase: 1,       label: "ml" },
  l:      { dim: "volume", toBase: 1000,    label: "L" },

  // mass (base: g)
  g:  { dim: "mass", toBase: 1,       label: "g" },
  kg: { dim: "mass", toBase: 1000,    label: "kg" },
  oz: { dim: "mass", toBase: 28.3495, label: "oz" },
  lb: { dim: "mass", toBase: 453.592, label: "lb" },

  // count (base: each)
  piece: { dim: "count", toBase: 1, label: "piece" },
  clove: { dim: "count", toBase: 1, label: "clove" },
  slice: { dim: "count", toBase: 1, label: "slice" },
};

export const UNIT_KEYS = Object.keys(UNITS);

export function isUnit(unit) {
  return Object.prototype.hasOwnProperty.call(UNITS, unit);
}

/** Throws on unknown units or dimension mismatch. */
export function convert(quantity, from, to) {
  if (!isUnit(from)) throw new Error(`Unknown unit: ${from}`);
  if (!isUnit(to)) throw new Error(`Unknown unit: ${to}`);

  const a = UNITS[from];
  const b = UNITS[to];

  if (a.dim !== b.dim) {
    throw new Error(
      `Cannot convert ${a.dim} (${from}) to ${b.dim} (${to}) — that needs ingredient density`
    );
  }

  return (quantity * a.toBase) / b.toBase;
}

/** Stored per serving, so scaling is multiplication. */
export function scaleIngredient(ingredient, servings) {
  return { ...ingredient, quantity: ingredient.quantity * servings };
}

export function scaleIngredients(ingredients, servings) {
  return ingredients.map((i) => scaleIngredient(i, servings));
}
