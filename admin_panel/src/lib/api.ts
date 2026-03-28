export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  is_active: boolean;
  /** Leaf categories only: when false, hidden from storefront home “Top categories” grid. */
  show_on_home: boolean;
  sort_order: number;
}

export interface AdminVariant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  compare_at_price: number | null;
  stock_qty: number;
  low_stock_threshold: number;
  is_active: boolean;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  badge: string | null;
  category_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  variants: AdminVariant[];
  images?: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
    sort_order: number;
  }>;
}

export interface HeroBannerPayload {
  desktop_url: string | null;
  mobile_url: string | null;
}

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  first_variant_id: string | null;
  sku: string | null;
  size: string | null;
  color: string | null;
  price: number | null;
  compare_at_price: number | null;
  stock_qty: number | null;
  image_url: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

/** API server origin without `/api/v1` — for `/uploads/...` URLs */
export function apiServerOrigin(): string {
  return API_BASE.replace(/\/api\/v1\/?$/i, "");
}

export function resolveUploadedAssetUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin = apiServerOrigin();
  const p = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${origin}${p}`;
}

function getAuthHeaders() {
  const token = localStorage.getItem("admin_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function throwIfNotOk(response: Response): Promise<void> {
  if (response.ok) return;
  if (response.status === 401) {
    localStorage.removeItem("admin_access_token");
    // Hard redirect to break out of any stuck state.
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  const text = await response.text();
  let message = `HTTP ${response.status}`;
  try {
    const data = JSON.parse(text) as { detail?: unknown };
    if (typeof data.detail === "string") message = data.detail;
    else if (Array.isArray(data.detail)) message = JSON.stringify(data.detail);
    else if (data.detail) message = String(data.detail);
  } catch {
    if (text) message = text.slice(0, 200);
  }
  throw new Error(message);
}

export async function apiLogin(email: string, password: string): Promise<{ access_token: string; refresh_token: string }> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  await throwIfNotOk(response);
  return response.json() as Promise<{ access_token: string; refresh_token: string }>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { headers: getAuthHeaders() });
  await throwIfNotOk(response);
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  await throwIfNotOk(response);
  return response.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  await throwIfNotOk(response);
  return response.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  await throwIfNotOk(response);
  return response.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  await throwIfNotOk(response);
}

export async function apiPostFormData<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
  await throwIfNotOk(response);
  return response.json() as Promise<T>;
}
