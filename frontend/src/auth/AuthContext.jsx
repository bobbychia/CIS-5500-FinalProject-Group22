import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { verifyGoogleCredential } from "../lib/api.js";

const STORAGE_KEY = "idealnest.auth.user";
const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const signInWithGoogle = useCallback(async (credential) => {
    setStatus("loading");
    setError("");

    try {
      const nextUser = await verifyGoogleCredential(credential);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
      setStatus("idle");
      return nextUser;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed";
      setError(message);
      setStatus("error");
      throw err;
    }
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setStatus("idle");
    setError("");
  }, []);

  const value = useMemo(
    () => ({
      error,
      isAuthenticated: Boolean(user),
      signInWithGoogle,
      signOut,
      status,
      user,
    }),
    [error, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
