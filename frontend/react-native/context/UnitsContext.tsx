import { createContext, useContext, useEffect, useState, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import { FALLBACK_UNITS, toMap, type Unit } from "../lib/units";

type UnitsContextType = {
  units: Unit[];
  unitMap: Record<string, Unit>;
  byDim: Record<string, Unit[]>;
};

const UnitsContext = createContext<UnitsContextType>({
  units: FALLBACK_UNITS,
  unitMap: toMap(FALLBACK_UNITS),
  byDim: {},
});

const CACHE_KEY = "bytes.units";

export function UnitsProvider({ children }: { children: React.ReactNode }) {
  // Bundled table first, then cache, then server.
  const [units, setUnits] = useState<Unit[]>(FALLBACK_UNITS);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const cached = await AsyncStorage.getItem(CACHE_KEY).catch(() => null);
      if (cached && !cancelled) {
        try {
          setUnits(JSON.parse(cached));
        } catch {
          // Corrupt cache, and the fallback is already loaded.
        }
      }

      try {
        const res = await fetch(`${BASE_URL}/api/units`);
        if (!res.ok) return;

        const fresh: Unit[] = await res.json();
        if (cancelled || !Array.isArray(fresh) || fresh.length === 0) return;

        setUnits(fresh);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {});
      } catch {
        // Offline, and the cached table is still correct.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => {
    const byDim: Record<string, Unit[]> = {};
    for (const u of units) (byDim[u.dim] ??= []).push(u);

    return { units, unitMap: toMap(units), byDim };
  }, [units]);

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}

export function useUnits() {
  return useContext(UnitsContext);
}
