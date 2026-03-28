import type { ApiProduct } from "@/lib/api";

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: string;
  sizes: string[];
  /** Distinct non-empty colors from variants (for PDP). */
  colors: string[];
  description: string;
  details: string[];
  badge?: string;
}

export function toCatalogProduct(product: ApiProduct, categorySlug = "all"): CatalogProduct {
  const firstVariant = product.variants[0];
  const images = product.images
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.image_url);

  const colors = Array.from(
    new Set(
      product.variants
        .map((v) => (v.color ?? "").trim())
        .filter(Boolean),
    ),
  );

  return {
    id: product.id,
    name: product.name,
    price: Number(firstVariant?.price ?? 0),
    originalPrice: firstVariant?.compare_at_price ? Number(firstVariant.compare_at_price) : undefined,
    image: images[0] ?? "/placeholder.svg",
    images: images.length > 0 ? images : ["/placeholder.svg"],
    category: categorySlug,
    sizes: Array.from(new Set(product.variants.map((variant) => variant.size).filter(Boolean) as string[])),
    colors,
    description: product.description ?? "",
    details: product.variants.map((variant) => [variant.sku, variant.color].filter(Boolean).join(" - ")),
    badge: product.badge ?? undefined,
  };
}
