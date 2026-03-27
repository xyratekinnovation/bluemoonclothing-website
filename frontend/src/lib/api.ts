export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface ApiVariant {
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

export interface ApiImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  badge: string | null;
  category_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  variants: ApiVariant[];
  images: ApiImage[];
}

export interface ApiCartItem {
  id: string;
  product_variant_id: string;
  quantity: number;
  unit_price_snapshot: number;
  variant: {
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
    price: number;
    compare_at_price: number | null;
    stock_qty: number;
    is_active: boolean;
    product: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export interface ApiCart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  items: ApiCartItem[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function throwIfNotOk(response: Response): Promise<void> {
  if (response.ok) return;
  if (response.status === 401) {
    localStorage.removeItem("access_token");
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

export async function apiRegister(payload: { name: string; email: string; password: string; phone?: string }): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await throwIfNotOk(response);
}

export async function apiGet<T>(path: string, authenticated = false): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authenticated ? authHeaders() : {},
  });
  await throwIfNotOk(response);
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, authenticated = false): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authenticated ? authHeaders() : {}) },
    body: JSON.stringify(body),
  });
  await throwIfNotOk(response);
  return response.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown, authenticated = false): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(authenticated ? authHeaders() : {}) },
    body: JSON.stringify(body),
  });
  await throwIfNotOk(response);
  return response.json() as Promise<T>;
}

export async function apiDelete(path: string, authenticated = false): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: authenticated ? authHeaders() : {},
  });
  await throwIfNotOk(response);
}
