import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { useUnits } from "../context/UnitsContext";
import ServingsStepper from "../components/ServingsStepper";
import { prettyAmount, scaleIngredients } from "../lib/units";

export default function RecipeDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const { unitMap } = useUnits();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [servings, setServings] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${BASE_URL}/api/recipes/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
        if (!cancelled) setRecipe(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  if (loading) return <p className="muted">Loading recipe…</p>;

  if (error) {
    return (
      <div className="alert alert-error">
        <p>{error}</p>
        <Link to="/" className="btn btn-ghost">
          Back to browse
        </Link>
      </div>
    );
  }

  // Derived live from the stepper.
  const scaled = scaleIngredients(recipe.ingredients, servings);
  const authorName = typeof recipe.author === "object" ? recipe.author?.name : null;

  return (
    <article className="detail">
      <h1>{recipe.title}</h1>
      {authorName && <p className="muted small">by {authorName}</p>}
      {recipe.description && <p className="lead">{recipe.description}</p>}

      {recipe.tags?.length > 0 && (
        <div className="tags">
          {recipe.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      )}

      <ServingsStepper servings={servings} onChange={setServings} />

      <section className="card">
        <h2>Ingredients</h2>
        <ul className="ingredients">
          {scaled.map((ing, i) => (
            <li key={`${ing.name}-${i}`}>
              <span className="amount">{prettyAmount(ing.quantity, ing.unit, unitMap)}</span>
              <span>{ing.name}</span>
            </li>
          ))}
        </ul>
        {servings !== 1 && (
          <p className="muted small">
            Scaled {servings}× from the saved single-serving amounts.
          </p>
        )}
      </section>

      {recipe.steps?.length > 0 && (
        <section className="card">
          <h2>Method</h2>
          <ol className="steps">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {recipe.cooks?.length > 0 && (
        <section className="card">
          <h2>Made it ({recipe.cooks.length})</h2>
          <div className="gallery">
            {recipe.cooks.map((cook) => (
              <figure key={cook._id}>
                <img src={cook.photoUrl} alt="" loading="lazy" />
                <figcaption className="muted small">
                  {cook.servings} serving{cook.servings === 1 ? "" : "s"} ·{" "}
                  {new Date(cook.cookedAt).toLocaleDateString()}
                  {cook.notes && <> — {cook.notes}</>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
