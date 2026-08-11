import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BASE_URL } from "../config";
import RecipeCard from "../components/RecipeCard";
import { useAuth } from "../context/AuthContext";

/** Public landing page. No auth needed. */
export default function Browse() {
  const { token } = useAuth();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${BASE_URL}/api/recipes/public`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);

        const data = await res.json();
        if (!cancelled) setRecipes(data);
      } catch {
        if (!cancelled) {
          setError(
            "Could not reach the Bytes API. If it's hosted on a free tier it may be waking up — try again in a moment."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="hero">
        <h1>Recipes that scale themselves</h1>
        <p>
          Every recipe in Bytes is stored for a single serving. Pick how many people you're
          feeding and the ingredient amounts do the arithmetic for you.
        </p>
        {!token && (
          <Link to="/login" className="btn btn-primary">
            Log in to build your library
          </Link>
        )}
      </section>

      <h2>Public recipes</h2>

      {loading && <p className="muted">Loading recipes…</p>}

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && recipes.length === 0 && (
        <p className="muted">
          No public recipes yet. Log in, create one, and switch on "Share publicly".
        </p>
      )}

      <div className="grid">
        {recipes.map((r) => (
          <RecipeCard key={r._id} recipe={r} to={`/recipe/${r._id}`} />
        ))}
      </div>
    </>
  );
}
