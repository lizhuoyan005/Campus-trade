const TOKEN_KEY = "campus_trade_token";
const USER_KEY = "campus_trade_user";

/** JWT Token 管理 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** 缓存的用户信息 */
export function getCachedUser(): any {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); }
  catch { return null; }
}

export function cacheUser(user: any): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** 带 JWT 的 fetch 封装，自动处理 {code, message, data} 响应格式 */
async function request<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ code: number; message: string; data: T; pagination?: any }> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || json.error || `请求失败 (${res.status})`);
  }

  return json;
}

export const api = {
  get: <T = any>(url: string) => request<T>(url),
  post: <T = any>(url: string, body?: any) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  patch: <T = any>(url: string, body?: any) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T = any>(url: string, body?: any) =>
    request<T>(url, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
};

/** SSR 端直接 fetch（不带 JWT，因为是服务端请求） */
export async function ssrFetch<T = any>(url: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(baseUrl + url, { cache: "no-store" });
  if (!res.ok) throw new Error(`请求失败 (${res.status})`);
  const json = await res.json();
  return json.data as T;
}

/** SSR 分页 fetch */
export async function ssrFetchPaginated<T = any>(url: string): Promise<{
  data: T[];
  pagination: { total: number; page: number; pageSize: number; totalPages: number };
}> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(baseUrl + url, { cache: "no-store" });
  if (!res.ok) throw new Error(`请求失败 (${res.status})`);
  const json = await res.json();
  return { data: json.data as T[], pagination: json.pagination };
}

/** 登录并缓存用户 */
export async function login(username: string, password: string): Promise<any> {
  const res = await api.post("/api/auth/login", { username, password });
  if (res.data) {
    setToken(res.data.token);
    cacheUser(res.data.user);
  }
  return res.data?.user;
}

/** 注册并自动登录 */
export async function register(data: {
  username: string;
  password: string;
  nickname: string;
  contact?: string;
}): Promise<any> {
  const res = await api.post("/api/auth/register", data);
  if (res.data) {
    setToken(res.data.token);
    cacheUser(res.data.user);
  }
  return res.data?.user;
}

/** 登出 */
export function logout(): void {
  clearToken();
}
