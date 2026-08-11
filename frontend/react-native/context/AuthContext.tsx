import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { BASE_URL } from "../config";

type User = { _id: string; name: string; email: string };
type Session = { token: string; user: User };

type FieldErrors = Record<string, string>;
type Result = { ok: boolean; message?: string; fields?: FieldErrors };

type AuthContextType = {
  token: string | null;
  user: User | null;
  /** Restoring the saved session, gates the first redirect. */
  restoring: boolean;
  submitting: boolean;
  login: (email: string, password: string) => Promise<Result>;
  register: (name: string, email: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  restoring: true,
  submitting: false,
  login: async () => ({ ok: false }),
  register: async () => ({ ok: false }),
  logout: async () => {},
});

const SESSION_KEY = "bytes.session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // JWT lives in SecureStore, since AsyncStorage is unencrypted.
  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(SESSION_KEY);
        if (saved) {
          const session: Session = JSON.parse(saved);
          setToken(session.token);
          setUser(session.user);
        }
      } catch {
        // Corrupt session, so drop it and re-authenticate.
        await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => {});
      } finally {
        setRestoring(false);
      }
    })();
  }, []);

  const authenticate = useCallback(
    async (path: string, body: Record<string, string>): Promise<Result> => {
      setSubmitting(true);

      try {
        const res = await fetch(`${BASE_URL}/api/users/${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          return {
            ok: false,
            message: data.error || "Something went wrong",
            fields: data.fields,
          };
        }

        const session: Session = { token: data.token, user: data.user };
        await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));

        setToken(session.token);
        setUser(session.user);

        return { ok: true };
      } catch {
        return {
          ok: false,
          message: `Could not reach the server at ${BASE_URL}. Check your connection.`,
        };
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const login = useCallback(
    (email: string, password: string) =>
      authenticate("login", { email: email.trim().toLowerCase(), password }),
    [authenticate]
  );

  const register = useCallback(
    (name: string, email: string, password: string) =>
      authenticate("register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    [authenticate]
  );

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => {});
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
