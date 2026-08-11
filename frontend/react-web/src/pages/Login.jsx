import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, submitting } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  function validate() {
    const next = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address";
    }
    if (!password) next.password = "Password is required";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const result = await login(email, password);

    if (result.ok) navigate("/library");
    else {
      setFormError(result.message);
      if (result.fields) setErrors(result.fields);
    }
  }

  return (
    <div className="narrow">
      <h1>Log in</h1>

      {formError && <div className="alert alert-error">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={errors.email ? "invalid" : ""}
          placeholder="you@example.com"
          autoComplete="email"
        />
        {errors.email && <p className="field-error">{errors.email}</p>}

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={errors.password ? "invalid" : ""}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        {errors.password && <p className="field-error">{errors.password}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="muted small">
        No account? <Link to="/register">Create one</Link>
      </p>
    </div>
  );
}
