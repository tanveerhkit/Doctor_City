import React, { createContext, useContext, useEffect, useState } from "react";
import csrfManager from "../utils/csrfManager";
import { buildApiUrl } from "../config/api";

const AUTH_USER_STORAGE_KEY = "authUser";

const AuthContext = createContext(null);

const readStoredAuth = () => {
  try {
    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);

    if (!token || !rawUser) {
      return { token: null, user: null };
    }

    return {
      token,
      user: JSON.parse(rawUser),
    };
  } catch (error) {
    console.error("Failed to restore auth state:", error);
    return { token: null, user: null };
  }
};

const persistAuth = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem("profileComplete", String(Boolean(user?.isProfileComplete)));
  window.dispatchEvent(new Event("storage-update"));
};

const clearStoredAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  localStorage.removeItem("profileComplete");
  sessionStorage.removeItem("profileJustSubmitted");
  csrfManager.clearToken();
  window.dispatchEvent(new Event("storage-update"));
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => readStoredAuth());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      setAuthState(readStoredAuth());
    };

    setIsLoaded(true);
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("storage-update", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("storage-update", syncAuthState);
    };
  }, []);

  const authenticate = async (path, payload) => {
    const response = await csrfManager.secureFetch(buildApiUrl(path), {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          data.errors?.[0]?.msg ||
          "Authentication failed"
      );
    }

    persistAuth(data.token, data.user);
    setAuthState({ token: data.token, user: data.user });
    return data.user;
  };

  const signIn = (email, password) =>
    authenticate("/api/auth/login", { email, password });

  const signUp = (name, email, password) =>
    authenticate("/api/auth/signup", { name, email, password });

  const signOut = () => {
    clearStoredAuth();
    setAuthState({ token: null, user: null });
  };

  const updateUser = (nextUser) => {
    const resolvedUser =
      typeof nextUser === "function" ? nextUser(authState.user) : nextUser;

    if (!authState.token || !resolvedUser) {
      return;
    }

    persistAuth(authState.token, resolvedUser);
    setAuthState({ token: authState.token, user: resolvedUser });
  };

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        token: authState.token,
        isLoaded,
        isSignedIn: Boolean(authState.token && authState.user),
        signIn,
        signUp,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
