import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { UnitsProvider } from "./context/UnitsContext";
import { RecipesProvider } from "./context/RecipesContext";

import Layout from "./components/Layout";
import Browse from "./pages/Browse";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Library from "./pages/Library";
import NewRecipe from "./pages/NewRecipe";
import RecipeDetail from "./pages/RecipeDetail";

import "./App.css";

/** Client-side gate. The server enforces the real one. */
function Protected({ children }) {
  const { token, restoring } = useAuth();

  if (restoring) return <p className="muted">Loading…</p>;
  return token ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }) {
  const { token, restoring } = useAuth();

  if (restoring) return <p className="muted">Loading…</p>;
  return token ? <Navigate to="/library" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UnitsProvider>
          <RecipesProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Browse />} />
                <Route path="recipe/:id" element={<RecipeDetail />} />

                <Route
                  path="login"
                  element={
                    <PublicOnly>
                      <Login />
                    </PublicOnly>
                  }
                />
                <Route
                  path="register"
                  element={
                    <PublicOnly>
                      <Register />
                    </PublicOnly>
                  }
                />

                <Route
                  path="library"
                  element={
                    <Protected>
                      <Library />
                    </Protected>
                  }
                />
                <Route
                  path="new"
                  element={
                    <Protected>
                      <NewRecipe />
                    </Protected>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </RecipesProvider>
        </UnitsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
