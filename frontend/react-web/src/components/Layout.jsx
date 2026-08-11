import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { token, user, logout } = useAuth();

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="brand">
          Bytes
        </Link>

        <nav className="nav">
          <NavLink to="/">Browse</NavLink>
          {token && <NavLink to="/library">My library</NavLink>}
          {token && <NavLink to="/new">New recipe</NavLink>}
        </nav>

        <div className="header-right">
          {token ? (
            <>
              <span className="muted small">{user?.name}</span>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Log in
            </Link>
          )}
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <p className="muted small">
          Bytes — recipes stored for one serving, scaled to however many people showed up.
        </p>
      </footer>
    </div>
  );
}
