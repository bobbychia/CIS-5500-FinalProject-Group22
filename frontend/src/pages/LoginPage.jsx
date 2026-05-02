import { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SearchNav from "../components/SearchNav.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import "../App.css";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_CLIENT_ID =
  typeof import.meta !== "undefined" ? import.meta.env.VITE_GOOGLE_CLIENT_ID : "";

function loadGoogleScript() {
  if (document.getElementById(GOOGLE_SCRIPT_ID)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load Google sign-in"));
    document.head.appendChild(script);
  });
}

export default function LoginPage() {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { error, isAuthenticated, signInWithGoogle, status } = useAuth();
  const from = location.state?.from?.pathname || "/find";

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [from, isAuthenticated, navigate]);

  useEffect(() => {
    let cancelled = false;

    async function renderButton() {
      if (!GOOGLE_CLIENT_ID || !buttonRef.current) return;

      await loadGoogleScript();
      if (cancelled || !window.google?.accounts?.id || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          if (!response.credential) return;
          try {
            await signInWithGoogle(response.credential);
            navigate(from, { replace: true });
          } catch {
            // AuthContext exposes the error message in the page UI.
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        shape: "pill",
        size: "large",
        text: "continue_with",
        theme: "outline",
        width: Math.min(360, buttonRef.current.offsetWidth || 360),
      });
    }

    renderButton().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [from, navigate, signInWithGoogle]);

  return (
    <div className="page layout page--auth">
      <SearchNav />
      <main className="auth-page wrap--narrow">
        <section className="auth-panel">
          <p className="eyebrow eyebrow--accent">Ideal Nest</p>
          <h1 className="auth-title">Sign in to continue</h1>
          <p className="auth-copy">
            Use your Google account to access saved search tools and explore ZIP-level housing,
            school, and income insights.
          </p>

          <div className="auth-google-slot" ref={buttonRef}>
            {!GOOGLE_CLIENT_ID ? (
              <p className="auth-message">
                Add <code>VITE_GOOGLE_CLIENT_ID</code> to the frontend environment first.
              </p>
            ) : null}
          </div>

          {status === "loading" ? <p className="auth-message">Signing you in...</p> : null}
          {error ? <p className="auth-message auth-message--error">{error}</p> : null}

          <Link className="auth-back-link" to="/">
            Back to home
          </Link>
        </section>
      </main>
    </div>
  );
}
