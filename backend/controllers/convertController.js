import { UNITS, convert } from "../lib/units.js";

/** GET /api/units. toBase lets clients convert offline. */
export function getUnits(_req, res) {
  const units = Object.entries(UNITS).map(([key, u]) => ({
    key,
    label: u.label,
    dim: u.dim,
    toBase: u.toBase,
  }));

  res.json(units);
}

/** POST /api/convert. Returns { quantity, unit, dim }. */
export function postConvert(req, res) {
  const { quantity, from, to } = req.clean;

  try {
    const result = convert(quantity, from, to);
    res.json({ quantity: result, unit: to, dim: UNITS[to].dim });
  } catch (err) {
    // A dimension mismatch is a bad request.
    res.status(400).json({ error: err.message });
  }
}
