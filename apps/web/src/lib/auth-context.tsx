"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  clearTokens,
  fetchMe,
  getSelectedFarmId,
  login as apiLogin,
  register as apiRegister,
  setSelectedFarmId as persistFarmId,
  setTokens,
} from "./api";
import type { Farm, User } from "./types";

type AuthContextValue = {
  user: User | null;
  farms: Farm[];
  selectedFarm: Farm | null;
  selectedFarmId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  selectFarm: (farmId: string) => void;
  refreshFarms: () => Promise<Farm[]>;
  hasToken: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  const applyFarms = useCallback((list: Farm[], preferredId?: string | null) => {
    setFarms(list);
    const stored = preferredId ?? getSelectedFarmId();
    const stillValid = stored && list.some((f) => f.id === stored);
    if (stillValid) {
      setSelectedFarmIdState(stored);
      persistFarmId(stored);
      return;
    }
    if (list.length === 1) {
      setSelectedFarmIdState(list[0].id);
      persistFarmId(list[0].id);
      return;
    }
    setSelectedFarmIdState(null);
    persistFarmId(null);
  }, []);

  const refreshFarms = useCallback(async () => {
    const list = await api<Farm[]>("/farms", { skipFarm: true });
    applyFarms(list, getSelectedFarmId());
    return list;
  }, [applyFarms]);

  const bootstrap = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    setHasToken(Boolean(token));
    if (!token) {
      setUser(null);
      setFarms([]);
      setSelectedFarmIdState(null);
      setLoading(false);
      return;
    }
    try {
      const me = await fetchMe();
      setUser({ id: me.id, name: me.name, email: me.email });
      const list = await api<Farm[]>("/farms", { skipFarm: true });
      applyFarms(list, getSelectedFarmId());
    } catch {
      clearTokens();
      setHasToken(false);
      setUser(null);
      setFarms([]);
      setSelectedFarmIdState(null);
      persistFarmId(null);
    } finally {
      setLoading(false);
    }
  }, [applyFarms]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiLogin(email, password);
      setTokens(res.accessToken, res.refreshToken);
      setHasToken(true);
      setUser(res.user);
      const list = await api<Farm[]>("/farms", { skipFarm: true });
      applyFarms(list, getSelectedFarmId());
    },
    [applyFarms],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await apiRegister(name, email, password);
      setTokens(res.accessToken, res.refreshToken);
      setHasToken(true);
      setUser(res.user);
      applyFarms([], null);
    },
    [applyFarms],
  );

  const logout = useCallback(() => {
    clearTokens();
    persistFarmId(null);
    setHasToken(false);
    setUser(null);
    setFarms([]);
    setSelectedFarmIdState(null);
  }, []);

  const selectFarm = useCallback((farmId: string) => {
    persistFarmId(farmId);
    setSelectedFarmIdState(farmId);
  }, []);

  const selectedFarm = useMemo(
    () => farms.find((f) => f.id === selectedFarmId) ?? null,
    [farms, selectedFarmId],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      farms,
      selectedFarm,
      selectedFarmId,
      loading,
      login,
      register,
      logout,
      selectFarm,
      refreshFarms,
      hasToken,
    }),
    [
      user,
      farms,
      selectedFarm,
      selectedFarmId,
      loading,
      login,
      register,
      logout,
      selectFarm,
      refreshFarms,
      hasToken,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
