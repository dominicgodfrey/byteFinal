import { Link } from "react-router-dom";

export default function RecipeCard({ recipe, to }) {
  const lastCook = recipe.cooks?.[recipe.cooks.length - 1];
  const authorName = typeof recipe.author === "object" ? recipe.author?.name : null;

  return (
    <Link to={to} className="card recipe-card">
      {lastCook ? (
        <img src={lastCook.photoUrl} alt="" className="recipe-card-photo" loading="lazy" />
      ) : (
        <div className="recipe-card-photo recipe-card-photo--empty" aria-hidden="true">
          🍳
        </div>
      )}

      <div className="recipe-card-body">
        <h3>{recipe.title}</h3>
        {recipe.description && <p className="muted">{recipe.description}</p>}

        <div className="recipe-card-meta">
          <span>{recipe.ingredients.length} ingredients</span>
          {recipe.cooks?.length > 0 && <span>made {recipe.cooks.length}×</span>}
          {authorName && <span>by {authorName}</span>}
        </div>

        {recipe.tags?.length > 0 && (
          <div className="tags">
            {recipe.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
