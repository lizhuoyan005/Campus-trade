"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCachedUser, clearToken } from "./api";

interface User {
  id: number;
  username: string;
  nickname: string;
  avatar?: string;
  role: "user" | "admin";
  contact?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // 从 localStorage 恢复用户信息
  useEffect(() => {
    const cached = getCachedUser();
    if (cached) setUser(cached);
  }, []);

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { api } = await import("./api");
      const res = await api.get("/api/auth/me");
      if (res.data) {
        setUser(res.data);
        const { cacheUser } = await import("./api");
        cacheUser(res.data);
      }
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
