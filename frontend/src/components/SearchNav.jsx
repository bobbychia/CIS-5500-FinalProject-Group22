import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

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

      </div>
    </header>
  );
}
