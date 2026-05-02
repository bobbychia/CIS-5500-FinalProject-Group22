import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

const TABS = [
  { label: "Home", path: "/", aliases: [] },
  { label: "Find", path: "/find", aliases: [] },
  { label: "Quick", path: "/quick", aliases: ["/recommended"] },
  { label: "Rank", path: "/rank", aliases: ["/rankings"] },
];

function isActive(pathname, tab) {
  if (tab.path === "/") return pathname === "/";
  return [tab.path, ...(tab.aliases || [])].some((path) => pathname.startsWith(path));
}

export default function SearchNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signOut, user } = useAuth();

  function navigateWithTransition(path) {
    if (path === location.pathname) return;
    const commit = () => navigate(path);

    if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
      document.startViewTransition(commit);
      return;
    }

    commit();
  }

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <button
          type="button"
          className="app-brand"
          onClick={() => navigateWithTransition("/")}
          aria-label="Go to home"
        >
          Ideal<em>Nest</em>
        </button>

        <nav className="app-nav" aria-label="Primary">
          {TABS.map((tab) => {
            const active = isActive(location.pathname, tab);

            return (
              <button
                key={tab.path}
                type="button"
                className={`app-nav__link ${active ? "is-active" : ""}`}
                onClick={() => navigateWithTransition(tab.path)}
              >
                {active ? (
                  <motion.span
                    layoutId="editorial-nav-pill"
                    className="app-nav__pill"
                    transition={{ type: "spring", stiffness: 360, damping: 28 }}
                  />
                ) : null}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="app-actions">
          {isAuthenticated ? (
            <div className="app-user">
              {user?.picture ? <img src={user.picture} alt="" className="app-user__avatar" /> : null}
              <span className="app-user__name">{user?.name || user?.email}</span>
              <button type="button" className="app-action-btn" onClick={signOut}>
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="app-action-btn"
              onClick={() => navigateWithTransition("/login")}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
