import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import type { CatalogProduct } from "@/types/catalog";

interface ProductCardProps {
  product: CatalogProduct;
}

const ProductCard = ({ product }: ProductCardProps) => (
  <Link
    to={`/product/${product.id}`}
    className="group block"
  >
    <div className="relative overflow-hidden rounded-lg bg-secondary mb-3 aspect-[4/5]">
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {product.badge && (
        <span className="absolute top-3 left-3 bg-gold-gradient text-primary-foreground text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-sm">
          {product.badge}
        </span>
      )}
      <button
        onClick={(e) => { e.preventDefault(); }}
        className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm p-2.5 rounded-full shadow-card opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
        aria-label="Quick add to cart"
      >
        <ShoppingBag className="w-4 h-4" />
      </button>
    </div>
    <h3 className="text-sm font-medium text-foreground mb-1 tracking-wide">{product.name}</h3>
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-primary">₹{product.price.toLocaleString()}</span>
      {product.originalPrice && (
        <span className="text-xs text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
      )}
    </div>
  </Link>
);

export default ProductCard;
