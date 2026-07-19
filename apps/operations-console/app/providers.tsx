"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { type AuthUser } from "@mevis/platform-contracts";

export type ThemeMode = "light" | "dark";

interface ThemeContextProps {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface AuthContextProps {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export interface NavItem {
  readonly name: string;
  readonly path: string;
  readonly icon?: string;
}

interface NavigationContextProps {
  items: NavItem[];
  currentPath: string;
  setCurrentPath: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextProps | undefined>(undefined);

export function Providers({ children }: { readonly children: React.ReactNode }) {
  // Theme Toggle
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Auth Session
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("mevis_sre_token");
    const storedUser = localStorage.getItem("mevis_sre_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = (jwtToken: string, authUser: AuthUser) => {
    localStorage.setItem("mevis_sre_token", jwtToken);
    localStorage.setItem("mevis_sre_user", JSON.stringify(authUser));
    setToken(jwtToken);
    setUser(authUser);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("mevis_sre_token");
    localStorage.removeItem("mevis_sre_user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Nav Items
  const [currentPath, setCurrentPath] = useState<string>("/ops/diagnostics");
  const navItems: NavItem[] = [
    { name: "Diagnostics Core", path: "/ops/diagnostics", icon: "🛠️" },
    { name: "Health Aggregator", path: "/ops/health", icon: "🏥" },
    { name: "Metrics Explorer", path: "/ops/metrics", icon: "📈" },
    { name: "Feature Flags", path: "/ops/flags", icon: "🏳️" },
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

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) throw new Error("useNavigation must be used within a NavigationProvider");
  return context;
}
