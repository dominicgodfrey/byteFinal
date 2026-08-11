import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
import { useAuth } from "./AuthContext";
import type { Recipe, RecipeInput } from "../types/Recipe";

type FieldErrors = Record<string, string>;
type Result<T = void> = { ok: boolean; data?: T; message?: string; fields?: FieldErrors };

type RecipesContextType = {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  /** Showing cached data because the network failed. */
  offline: boolean;
  refresh: () => Promise<void>;
  getRecipeById: (id: string) => Recipe | undefined;
  fetchRecipe: (id: string) => Promise<Result<Recipe>>;
  addRecipe: (input: RecipeInput) => Promise<Result<Recipe>>;
  updateRecipe: (id: string, input: Partial<RecipeInput>) => Promise<Result<Recipe>>;
  deleteRecipe: (id: string) => Promise<Result>;
  addCook: (
    id: string,
    cook: { photoUrl: string; photoPublicId?: string; servings: number; notes?: string }
  ) => Promise<Result<Recipe>>;
  deleteCook: (id: string, cookId: string) => Promise<Result<Recipe>>;
};

const RecipesContext = createContext<RecipesContextType>({} as RecipesContextType);

// Namespaced per user, so accounts never mix.
const cacheKey = (userId: string) => `bytes.recipes.${userId}`;

export function RecipesProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  // Stops a stale response overwriting a newer one.
  const requestId = useRef(0);

  const authHeaders = useCallback(
    (json = true) => ({
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const writeCache = useCallback(
    async (list: Recipe[]) => {
      if (!user) return;
      await AsyncStorage.setItem(cacheKey(user._id), JSON.stringify(list)).catch(() => {});
    },
    [user]
  );

  /** Updates state and the offline cache together. */
  const commit = useCallback(
    (updater: (prev: Recipe[]) => Recipe[]) => {
      setRecipes((prev) => {
        const next = updater(prev);
        writeCache(next);
        return next;
      });
    },
    [writeCache]
  );

  const refresh = useCallback(async () => {
    if (!token || !user) return;

    const id = ++requestId.current;
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/api/recipes`, { headers: authHeaders(false) });
      if (id !== requestId.current) return;

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const list: Recipe[] = await res.json();

      setRecipes(list);
      setOffline(false);
      await writeCache(list);
    } catch (e) {
      if (id !== requestId.current) return;

      // Prefer stale recipes over an empty library.
      const cached = await AsyncStorage.getItem(cacheKey(user._id)).catch(() => null);

      if (cached) {
        setRecipes(JSON.parse(cached));
        setOffline(true);
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : "Could not load your recipes");
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [token, user, authHeaders, writeCache]);

  // Paint the cache first, then refresh.
  useEffect(() => {
    if (!token || !user) {
      setRecipes([]);
      setLoading(false);
      setOffline(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const cached = await AsyncStorage.getItem(cacheKey(user._id)).catch(() => null);
      if (!cancelled && cached) setRecipes(JSON.parse(cached));
      if (!cancelled) await refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [token, user, refresh]);

  const getRecipeById = useCallback(
    (id: string) => recipes.find((r) => r._id === id),
    [recipes]
  );

  /** Fetches one recipe fresh, keeping cook photos current. */
  const fetchRecipe = useCallback(
    async (id: string): Promise<Result<Recipe>> => {
      try {
        const res = await fetch(`${BASE_URL}/api/recipes/${id}`, { headers: authHeaders(false) });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) return { ok: false, message: data.error || "Could not load that recipe" };

        commit((prev) => prev.map((r) => (r._id === id ? data : r)));
        return { ok: true, data };
      } catch {
        return { ok: false, message: "Could not reach the server" };
      }
    },
    [authHeaders, commit]
  );

  const addRecipe = useCallback(
    async (input: RecipeInput): Promise<Result<Recipe>> => {
      try {
        const res = await fetch(`${BASE_URL}/api/recipes`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(input),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          return { ok: false, message: data.error || "Could not save", fields: data.fields };
        }

        commit((prev) => [data, ...prev]);
        return { ok: true, data };
      } catch {
        return { ok: false, message: "Could not reach the server. Your recipe was not saved." };
      }
    },
    [authHeaders, commit]
  );

  const updateRecipe = useCallback(
    async (id: string, input: Partial<RecipeInput>): Promise<Result<Recipe>> => {
      try {
        const res = await fetch(`${BASE_URL}/api/recipes/${id}`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(input),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          return { ok: false, message: data.error || "Could not update", fields: data.fields };
        }

        commit((prev) => prev.map((r) => (r._id === id ? data : r)));
        return { ok: true, data };
      } catch {
        return { ok: false, message: "Could not reach the server. Your changes were not saved." };
      }
    },
    [authHeaders, commit]
  );

  const deleteRecipe = useCallback(
    async (id: string): Promise<Result> => {
      try {
        const res = await fetch(`${BASE_URL}/api/recipes/${id}`, {
          method: "DELETE",
          headers: authHeaders(false),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return { ok: false, message: data.error || "Could not delete" };
        }

        commit((prev) => prev.filter((r) => r._id !== id));
        return { ok: true };
      } catch {
        return { ok: false, message: "Could not reach the server. Nothing was deleted." };
      }
    },
    [authHeaders, commit]
  );

  const addCook = useCallback(
    async (
      id: string,
      cook: { photoUrl: string; photoPublicId?: string; servings: number; notes?: string }
    ): Promise<Result<Recipe>> => {
      try {
        const res = await fetch(`${BASE_URL}/api/recipes/${id}/cooks`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(cook),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) return { ok: false, message: data.error || "Could not save the photo" };

        commit((prev) => prev.map((r) => (r._id === id ? data : r)));
        return { ok: true, data };
      } catch {
        return { ok: false, message: "Could not reach the server" };
      }
    },
    [authHeaders, commit]
  );

  const deleteCook = useCallback(
    async (id: string, cookId: string): Promise<Result<Recipe>> => {
      try {
        const res = await fetch(`${BASE_URL}/api/recipes/${id}/cooks/${cookId}`, {
          method: "DELETE",
          headers: authHeaders(false),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) return { ok: false, message: data.error || "Could not delete the photo" };

        commit((prev) => prev.map((r) => (r._id === id ? data : r)));
        return { ok: true, data };
      } catch {
        return { ok: false, message: "Could not reach the server" };
      }
    },
    [authHeaders, commit]
  );

  return (
    <RecipesContext.Provider
      value={{
        recipes,
        loading,
        error,
        offline,
        refresh,
        getRecipeById,
        fetchRecipe,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        addCook,
        deleteCook,
      }}
    >
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes() {
  return useContext(RecipesContext);
}
