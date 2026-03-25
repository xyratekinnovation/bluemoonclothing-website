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

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet<T>(path: string, authenticated = false): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authenticated ? authHeaders() : {},
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, authenticated = false): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authenticated ? authHeaders() : {}) },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
