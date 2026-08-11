import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecipes } from "../context/RecipesContext";
import { useUnits } from "../context/UnitsContext";

const emptyRow = () => ({ name: "", quantity: "", unit: "g" });

/** Divides entered amounts down to one serving. */
export default function NewRecipe() {
  const navigate = useNavigate();
  const { addRecipe } = useRecipes();
  const { units, byDim } = useUnits();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("1");
  const [rows, setRows] = useState([emptyRow()]);
  const [stepsText, setStepsText] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const updateRow = (index, patch) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    setErrors((e) => {
      const next = { ...e };
      delete next[`ingredients.${index}.name`];
      delete next[`ingredients.${index}.quantity`];
      delete next.ingredients;
      return next;
    });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index) =>
    setRows((prev) => (prev.length === 1 ? [emptyRow()] : prev.filter((_, i) => i !== index)));

  function validate() {
    const next = {};

    if (title.trim().length < 2) next.title = "Give the recipe a name";
    else if (title.trim().length > 80) next.title = "Keep it under 80 characters";

    const n = Number(servings);
    if (!Number.isFinite(n) || n < 1) next.enteredForServings = "Enter 1 or more";

    const filled = rows.filter((r) => r.name.trim() || r.quantity.trim());
    if (filled.length === 0) next.ingredients = "Add at least one ingredient";

    rows.forEach((row, i) => {
      if (!row.name.trim() && !row.quantity.trim()) return;

      if (!row.name.trim()) next[`ingredients.${i}.name`] = "Name required";

      const q = Number(row.quantity);
      if (!row.quantity.trim() || !Number.isFinite(q) || q <= 0) {
        next[`ingredients.${i}.quantity`] = "Amount must be greater than 0";
      }
    });

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!validate()) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    const n = Number(servings);

    const input = {
      title: title.trim(),
      description: description.trim(),
      enteredForServings: n,
      // Normalize to one serving, so scaling multiplies.
      ingredients: rows
        .filter((r) => r.name.trim() && r.quantity.trim())
        .map((r) => ({
          name: r.name.trim(),
          quantity: Number(r.quantity) / n,
          unit: r.unit,
        })),
      steps: stepsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      tags: tagsText
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      isPublic,
    };

    setSubmitting(true);
    const result = await addRecipe(input);
    setSubmitting(false);

    if (result.ok) navigate(`/recipe/${result.data._id}`);
    else {
      setFormError(result.message);
      if (result.fields) setErrors(result.fields);
    }
  }

  return (
    <div className="narrow">
      <h1>New recipe</h1>

      {formError && <div className="alert alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="title">Recipe name</label>
        <input
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors((x) => ({ ...x, title: "" }));
          }}
          className={errors.title ? "invalid" : ""}
          placeholder="Garlic pasta"
          maxLength={80}
        />
        {errors.title && <p className="field-error">{errors.title}</p>}

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="What is it, and when would you make it?"
        />

        <label htmlFor="servings">These amounts make how many servings?</label>
        <input
          id="servings"
          type="number"
          min="1"
          step="0.5"
          value={servings}
          onChange={(e) => {
            setServings(e.target.value);
            setErrors((x) => ({ ...x, enteredForServings: "" }));
          }}
          className={`short ${errors.enteredForServings ? "invalid" : ""}`}
        />
        {errors.enteredForServings ? (
          <p className="field-error">{errors.enteredForServings}</p>
        ) : (
          <p className="muted small">
            Enter the recipe as you have it written. Bytes stores it per serving so it can
            scale to any size later.
          </p>
        )}

        <fieldset>
          <legend>Ingredients</legend>
          {errors.ingredients && <p className="field-error">{errors.ingredients}</p>}

          {rows.map((row, i) => {
            const rowError =
              errors[`ingredients.${i}.quantity`] || errors[`ingredients.${i}.name`];

            return (
              <div key={i} className="ingredient-row">
                <div className="ingredient-inputs">
                  <input
                    value={row.quantity}
                    onChange={(e) => updateRow(i, { quantity: e.target.value })}
                    placeholder="0"
                    type="number"
                    min="0"
                    step="any"
                    className={`qty ${rowError ? "invalid" : ""}`}
                    aria-label={`Ingredient ${i + 1} amount`}
                  />

                  <select
                    value={row.unit}
                    onChange={(e) => updateRow(i, { unit: e.target.value })}
                    aria-label={`Ingredient ${i + 1} unit`}
                  >
                    {Object.entries(byDim).map(([dim, list]) => (
                      <optgroup key={dim} label={dim}>
                        {list.map((u) => (
                          <option key={u.key} value={u.key}>
                            {u.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    {units.length === 0 && <option value="g">g</option>}
                  </select>

                  <input
                    value={row.name}
                    onChange={(e) => updateRow(i, { name: e.target.value })}
                    placeholder="ingredient"
                    className={rowError ? "invalid" : ""}
                    aria-label={`Ingredient ${i + 1} name`}
                    maxLength={60}
                  />

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => removeRow(i)}
                    aria-label={`Remove ingredient ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>

                {rowError && <p className="field-error">{rowError}</p>}
              </div>
            );
          })}

          <button type="button" className="btn btn-ghost" onClick={addRow}>
            + Add ingredient
          </button>
        </fieldset>

        <label htmlFor="steps">Method</label>
        <textarea
          id="steps"
          value={stepsText}
          onChange={(e) => setStepsText(e.target.value)}
          rows={5}
          placeholder={"One step per line.\nBoil the pasta.\nWarm the garlic in oil."}
        />
        <p className="muted small">One step per line.</p>

        <label htmlFor="tags">Tags</label>
        <input
          id="tags"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="dinner, quick, vegetarian"
        />
        <p className="muted small">Separate with commas.</p>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Share publicly — show this on the Browse page for anyone to see
        </label>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : "Save recipe"}
        </button>
      </form>
    </div>
  );
}
