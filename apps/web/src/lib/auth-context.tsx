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
  fetchMe,
  getSelectedFarmId,
  login as apiLogin,
  logoutRequest,
  setSelectedFarmId as persistFarmId,
} from "./api";
import type { Farm, User } from "./types";

type AuthContextValue = {
  user: User | null;
  farms: Farm[];
  selectedFarm: Farm | null;
  selectedFarmId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectFarm: (farmId: string) => void;
  refreshFarms: () => Promise<Farm[]>;
  /** true quando há sessão válida (cookie httpOnly confirmado via /auth/me) */
  hasToken: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const resetSession = useCallback(() => {
    persistFarmId(null);
    setUser(null);
    setFarms([]);
    setSelectedFarmIdState(null);
  }, []);

  const refreshFarms = useCallback(async () => {
    const list = await api<Farm[]>("/farms", { skipFarm: true });
    applyFarms(list, getSelectedFarmId());
    return list;
  }, [applyFarms]);

  const bootstrap = useCallback(async () => {
    try {
      const me = await fetchMe();
      setUser({ id: me.id, name: me.name, email: me.email });
      const list = await api<Farm[]>("/farms", { skipFarm: true });
      applyFarms(list, getSelectedFarmId());
    } catch {
      resetSession();
    } finally {
      setLoading(false);
    }
  }, [applyFarms, resetSession]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiLogin(email, password);
      setUser(res.user);
      const list = await api<Farm[]>("/farms", { skipFarm: true });
      applyFarms(list, getSelectedFarmId());
    },
    [applyFarms],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    resetSession();
  }, [resetSession]);

  const selectFarm = useCallback((farmId: string) => {
    persistFarmId(farmId);
    setSelectedFarmIdState(farmId);
  }, []);

  const selectedFarm = useMemo(
    () => farms.find((f) => f.id === selectedFarmId) ?? null,
    [farms, selectedFarmId],
  );

  const hasToken = Boolean(user);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      farms,
      selectedFarm,
      selectedFarmId,
      loading,
      login,
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
