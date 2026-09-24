import type { AuthResponse, User } from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

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
  skipAuth?: boolean;
  skipFarm?: boolean;
};

function getStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
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

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { skipAuth, skipFarm, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (!headers.has("Content-Type") && rest.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = getStorage("accessToken");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  if (!skipFarm) {
    const farmId = getSelectedFarmId();
    if (farmId) headers.set("X-Farm-Id", farmId);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers,
  });

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
    skipAuth: true,
    skipFarm: true,
  });
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return api<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
    skipAuth: true,
    skipFarm: true,
  });
}

export async function fetchMe(): Promise<
  User & {
    memberships: Array<{ farm: { id: string; name: string; city?: string | null; state?: string | null } }>;
  }
> {
  return api("/auth/me", { skipFarm: true });
}

export async function refreshAccessToken(): Promise<AuthResponse> {
  const refreshToken = getStorage("refreshToken");
  if (!refreshToken) throw new ApiError("Sem refresh token", 401);
  return api<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
    skipAuth: true,
    skipFarm: true,
  });
}
