import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, submitting } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  function validate() {
    const next = {};

    if (form.name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address";
    }
    if (form.password.length < 8) next.password = "Password must be at least 8 characters";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const result = await register(form.name, form.email, form.password);

    if (result.ok) navigate("/library");
    else {
      setFormError(result.message);
      if (result.fields) setErrors(result.fields);
    }
  }

  return (
    <div className="narrow">
      <h1>Create an account</h1>

      {formError && <div className="alert alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={form.name}
          onChange={update("name")}
          className={errors.name ? "invalid" : ""}
          autoComplete="name"
        />
        {errors.name && <p className="field-error">{errors.name}</p>}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={update("email")}
          className={errors.email ? "invalid" : ""}
          autoComplete="email"
        />
        {errors.email && <p className="field-error">{errors.email}</p>}

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={update("password")}
          className={errors.password ? "invalid" : ""}
          autoComplete="new-password"
        />
        {errors.password ? (
          <p className="field-error">{errors.password}</p>
        ) : (
          <p className="muted small">At least 8 characters</p>
        )}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="muted small">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
