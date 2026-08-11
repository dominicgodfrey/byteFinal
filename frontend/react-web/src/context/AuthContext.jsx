import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BASE_URL } from "../config";

const AuthContext = createContext(null);

const STORAGE_KEY = "bytes.session";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Any script can read this; server revalidates.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        setToken(session.token);
        setUser(session.user);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setRestoring(false);
    }
  }, []);

  const authenticate = useCallback(async (path, body) => {
    setSubmitting(true);

    try {
      const res = await fetch(`${BASE_URL}/api/users/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return { ok: false, message: data.error || "Something went wrong", fields: data.fields };
      }

      const session = { token: data.token, user: data.user };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

      setToken(session.token);
      setUser(session.user);

      return { ok: true };
    } catch {
      return { ok: false, message: `Could not reach the server at ${BASE_URL}` };
    } finally {
      setSubmitting(false);
    }
  }, []);

  const login = useCallback(
    (email, password) =>
      authenticate("login", { email: email.trim().toLowerCase(), password }),
    [authenticate]
  );

  const register = useCallback(
    (name, email, password) =>
      authenticate("register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    [authenticate]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, restoring, submitting, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
