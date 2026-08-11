import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { BASE_URL } from "../config";
import { FALLBACK_UNITS, toMap } from "../lib/units";

const UnitsContext = createContext(null);

export function UnitsProvider({ children }) {
  const [units, setUnits] = useState(FALLBACK_UNITS);

  useEffect(() => {
    let cancelled = false;

    fetch(`${BASE_URL}/api/units`)
      .then((res) => (res.ok ? res.json() : null))
      .then((fresh) => {
        if (!cancelled && Array.isArray(fresh) && fresh.length) setUnits(fresh);
      })
      .catch(() => {
        // Unreachable, and the bundled table is correct.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => {
    const byDim = {};
    for (const u of units) (byDim[u.dim] ??= []).push(u);

    return { units, unitMap: toMap(units), byDim };
  }, [units]);

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}

export function useUnits() {
  return useContext(UnitsContext);
}
