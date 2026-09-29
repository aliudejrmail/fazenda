import type { AuthResponse, User } from "./types";

/**
 * Por padrão a API é acessada via proxy same-origin do Next (`/api/v1`, ver
 * next.config.ts), o que mantém os cookies httpOnly como first-party.
 * `NEXT_PUBLIC_API_URL` permite apontar direto para outra origem (exige
 * CORS + COOKIE_SAMESITE=none no backend).
 */
// `||` (e não `??`): no Render a variável pode existir com valor vazio ("").
const API_URL = (process.env.NEXT_PUBLIC_API_URL?.trim() || "/api/v1").replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type ApiOptions = RequestInit & {
  skipFarm?: boolean;
  /** não tenta refresh automático em 401 (ex.: login, refresh) */
  skipRefresh?: boolean;
  /** interno: evita loop infinito no refresh */
  _retry?: boolean;
};

const CSRF_HEADERS = { "X-Requested-With": "fazenda-web" };

function getStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

export function getSelectedFarmId(): string | null {
  return getStorage("selectedFarmId");
}

export function setSelectedFarmId(id: string | null) {
  if (!id) {
    localStorage.removeItem("selectedFarmId");
    return;
  }
  localStorage.setItem("selectedFarmId", id);
}

async function parseError(res: Response): Promise<ApiError> {
  let body: unknown = null;
  let message = `Erro ${res.status}`;
  try {
    body = await res.json();
    if (body && typeof body === "object") {
      const b = body as { message?: string | string[] };
      if (Array.isArray(b.message)) message = b.message.join(", ");
      else if (typeof b.message === "string") message = b.message;
    }
  } catch {
    /* ignore */
  }
  return new ApiError(message, res.status, body);
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...CSRF_HEADERS },
    body: "{}",
  });
  return res.ok;
}

function ensureRefresh(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshSession()
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { skipFarm, skipRefresh, _retry, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (!headers.has("Content-Type") && rest.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("X-Requested-With", CSRF_HEADERS["X-Requested-With"]);

  if (!skipFarm) {
    const farmId = getSelectedFarmId();
    if (farmId) headers.set("X-Farm-Id", farmId);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !skipRefresh && !_retry) {
    if (await ensureRefresh()) {
      return api<T>(path, { ...options, _retry: true });
    }
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipFarm: true,
    skipRefresh: true,
  });
}

export async function logoutRequest(): Promise<void> {
  try {
    await api("/auth/logout", {
      method: "POST",
      body: "{}",
      skipFarm: true,
    });
  } catch {
    /* melhor esforço: cookies expiram de qualquer forma */
  }
}

export async function fetchMe(): Promise<
  User & {
    memberships: Array<{
      farm: {
        id: string;
        name: string;
        city?: string | null;
        state?: string | null;
      };
    }>;
  }
> {
  return api("/auth/me", { skipFarm: true });
}
