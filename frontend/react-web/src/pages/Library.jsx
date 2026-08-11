import { Link } from "react-router-dom";
import { useRecipes } from "../context/RecipesContext";
import RecipeCard from "../components/RecipeCard";

export default function Library() {
  const { recipes, loading, error, refresh } = useRecipes();

  return (
    <>
      <div className="page-header">
        <h1>My library</h1>
        <Link to="/new" className="btn btn-primary">
          New recipe
        </Link>
      </div>

      {loading && <p className="muted">Loading your recipes…</p>}

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button type="button" className="btn btn-ghost" onClick={refresh}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && recipes.length === 0 && (
        <div className="empty">
          <p>Your library is empty.</p>
          <p className="muted">
            Save a recipe once at whatever size you have it written. Bytes stores it per
            serving so you can cook it at any size later.
          </p>
          <Link to="/new" className="btn btn-primary">
            Create your first recipe
          </Link>
        </div>
      )}

      <div className="grid">
        {recipes.map((r) => (
          <RecipeCard key={r._id} recipe={r} to={`/recipe/${r._id}`} />
        ))}
      </div>
    </>
  );
}
