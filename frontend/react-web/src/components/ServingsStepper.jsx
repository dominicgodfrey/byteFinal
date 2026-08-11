export default function ServingsStepper({ servings, onChange }) {
  return (
    <div className="stepper">
      <div>
        <strong>Cooking for</strong>
        <p className="muted small">Amounts scale automatically</p>
      </div>

      <div className="stepper-controls">
        {/* Functional updates, so fast clicks cannot drop steps */}
        <button
          type="button"
          onClick={() => onChange((s) => Math.max(1, s - 1))}
          disabled={servings <= 1}
          aria-label="One fewer serving"
        >
          −
        </button>

        <div className="stepper-count">
          <span className="stepper-value">{servings}</span>
          <span className="muted small">{servings === 1 ? "serving" : "servings"}</span>
        </div>

        <button
          type="button"
          onClick={() => onChange((s) => Math.min(50, s + 1))}
          disabled={servings >= 50}
          aria-label="One more serving"
        >
          +
        </button>
      </div>
    </div>
  );
}
