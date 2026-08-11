import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BASE_URL } from "../config";
import { useAuth } from "./AuthContext";

const RecipesContext = createContext(null);

export function RecipesProvider({ children }) {
  const { token } = useAuth();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setRecipes([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/api/recipes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      setRecipes(await res.json());
    } catch (e) {
      setError(e.message || "Could not load your recipes");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addRecipe = useCallback(
    async (input) => {
      try {
        const res = await fetch(`${BASE_URL}/api/recipes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(input),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          return { ok: false, message: data.error || "Could not save", fields: data.fields };
        }

        setRecipes((prev) => [data, ...prev]);
        return { ok: true, data };
      } catch {
        return { ok: false, message: "Could not reach the server" };
      }
    },
    [token]
  );

  const deleteRecipe = useCallback(
    async (id) => {
      try {
        const res = await fetch(`${BASE_URL}/api/recipes/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          return { ok: false, message: data.error || "Could not delete" };
        }

        setRecipes((prev) => prev.filter((r) => r._id !== id));
        return { ok: true };
      } catch {
        return { ok: false, message: "Could not reach the server" };
      }
    },
    [token]
  );

  return (
    <RecipesContext.Provider
      value={{ recipes, loading, error, refresh, addRecipe, deleteRecipe }}
    >
      {children}
    </RecipesContext.Provider>
  );
}

export function useRecipes() {
  return useContext(RecipesContext);
}
