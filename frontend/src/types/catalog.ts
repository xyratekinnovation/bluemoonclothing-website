import { resolvePublicAssetUrl, type ApiProduct } from "@/lib/api";

/** Inline placeholder when a product has no image (avoids shipping unused public SVGs). */
const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect fill='%23e8e6e3' width='400' height='500'/%3E%3C/svg%3E";

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

export function toCatalogProduct(
  product: ApiProduct,
  categorySlug = "all",
  /** Bust browser cache for CDN/upload URLs when listing data refetches. */
  cacheBust?: number,
): CatalogProduct {
  const firstVariant = product.variants[0];
  const images = product.images
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.image_url);

  const mapImg = (url: string) => resolvePublicAssetUrl(url, cacheBust) ?? NO_IMAGE_PLACEHOLDER;

  const colors = Array.from(
    new Set(
      product.variants
        .map((v) => (v.color ?? "").trim())
        .filter(Boolean),
    ),
  );

  const resolved = images.map(mapImg);

  return {
    id: product.id,
    name: product.name,
    price: Number(firstVariant?.price ?? 0),
    originalPrice: firstVariant?.compare_at_price ? Number(firstVariant.compare_at_price) : undefined,
    image: resolved[0] ?? NO_IMAGE_PLACEHOLDER,
    images: resolved.length > 0 ? resolved : [NO_IMAGE_PLACEHOLDER],
    category: categorySlug,
    sizes: Array.from(new Set(product.variants.map((variant) => variant.size).filter(Boolean) as string[])),
    colors,
    description: product.description ?? "",
    details: product.variants.map((variant) => [variant.sku, variant.color].filter(Boolean).join(" - ")),
    badge: product.badge ?? undefined,
  };
}
