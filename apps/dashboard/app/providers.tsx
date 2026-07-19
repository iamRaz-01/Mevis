"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// --- Theme Types & Context ---
export type ThemeMode = "light" | "dark";

interface ThemeContextProps {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// --- Authentication Types & Context ---
export interface AuthUser {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly roles: string[];
}

interface AuthContextProps {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// --- Navigation Context & Metadata ---
export interface NavItem {
  readonly name: string;
  readonly path: string;
  readonly icon?: string;
  readonly roles?: string[];
}

interface NavigationContextProps {
  items: NavItem[];
  currentPath: string;
  setCurrentPath: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextProps | undefined>(undefined);

// --- Providers Rollup Component ---
export function Providers({ children }: { readonly children: React.ReactNode }) {
  // 1. Theme state logic
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // 2. Authentication state logic (using localStorage safely)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("mevis_auth_token");
    const storedUser = localStorage.getItem("mevis_auth_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = (jwtToken: string, authUser: AuthUser) => {
    localStorage.setItem("mevis_auth_token", jwtToken);
    localStorage.setItem("mevis_auth_user", JSON.stringify(authUser));
    setToken(jwtToken);
    setUser(authUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("mevis_auth_token");
    localStorage.removeItem("mevis_auth_user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // 3. Navigation items registry
  const [currentPath, setCurrentPath] = useState<string>("/dashboard");
  const navItems: NavItem[] = [
    { name: "Overview", path: "/dashboard", icon: "📊" },
    { name: "Incidents", path: "/dashboard/incidents", icon: "🚨", roles: ["ROLE_ADMIN", "ROLE_EVENT_COORDINATOR"] },
    { name: "Volunteers", path: "/dashboard/volunteers", icon: "👥", roles: ["ROLE_ADMIN", "ROLE_EVENT_COORDINATOR"] },
    { name: "Context Intelligence", path: "/dashboard/context", icon: "🧠", roles: ["ROLE_ADMIN"] },
    { name: "Settings", path: "/dashboard/settings", icon: "⚙️" },
  ];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
        <NavigationContext.Provider value={{ items: navItems, currentPath, setCurrentPath }}>
          {children}
        </NavigationContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

// --- Hook Utilities ---
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
