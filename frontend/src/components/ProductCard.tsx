import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import type { CatalogProduct } from "@/types/catalog";

interface ProductCardProps {
  product: CatalogProduct;
  /** Smaller tile for homepage featured row */
  compact?: boolean;
}

const ProductCard = ({ product, compact }: ProductCardProps) => (
  <Link
    to={`/product/${product.id}`}
    className={`group block ${compact ? "max-w-[11rem] sm:max-w-[12rem] mx-auto" : ""}`}
  >
    <div
      className={`relative overflow-hidden rounded-lg bg-secondary ${
        compact ? "mb-2 aspect-[3/4] max-h-[11.5rem] sm:max-h-[13rem]" : "mb-3 aspect-[4/5]"
      }`}
    >
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {product.badge && (
        <span
          className={`absolute bg-gold-gradient text-primary-foreground font-semibold tracking-wider uppercase rounded-sm ${
            compact ? "top-2 left-2 text-[9px] px-2 py-0.5" : "top-3 left-3 text-[10px] px-2.5 py-1"
          }`}
        >
          {product.badge}
        </span>
      )}
      <button
        onClick={(e) => { e.preventDefault(); }}
        className={`absolute bg-background/90 backdrop-blur-sm rounded-full shadow-card opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-primary-foreground ${
          compact ? "bottom-2 right-2 p-2" : "bottom-3 right-3 p-2.5"
        }`}
        aria-label="Quick add to cart"
      >
        <ShoppingBag className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
      </button>
    </div>
    <h3
      className={`font-medium text-foreground tracking-wide line-clamp-2 ${
        compact ? "text-xs mb-0.5" : "text-sm mb-1"
      }`}
    >
      {product.name}
    </h3>
    <div className={`flex items-center gap-2 ${compact ? "flex-wrap" : ""}`}>
      <span className={`font-semibold text-primary ${compact ? "text-xs" : "text-sm"}`}>
        ₹{product.price.toLocaleString()}
      </span>
      {product.originalPrice && (
        <span className={`text-muted-foreground line-through ${compact ? "text-[10px]" : "text-xs"}`}>
          ₹{product.originalPrice.toLocaleString()}
        </span>
      )}
    </div>
  </Link>
);

export default ProductCard;
