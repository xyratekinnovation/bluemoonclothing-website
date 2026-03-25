import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ShoppingBag, Heart } from "lucide-react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { apiGet, type ApiCategory, type ApiProduct } from "@/lib/api";
import { toCatalogProduct } from "@/types/catalog";

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<ApiCategory[]>("/categories"),
  });
  const { data: apiProduct } = useQuery({
    queryKey: ["product", id],
    queryFn: () => apiGet<ApiProduct>(`/products/${id}`),
    enabled: Boolean(id),
  });
  const productCategory = categories.find((category) => category.id === apiProduct?.category_id)?.slug ?? "all";
  const product = apiProduct ? toCatalogProduct(apiProduct, productCategory) : undefined;
  const { data: relatedApi = [] } = useQuery({
    queryKey: ["related", productCategory, id],
    queryFn: () =>
      apiProduct?.category_id
        ? apiGet<ApiProduct[]>(`/products?category_id=${apiProduct.category_id}&limit=8`)
        : Promise.resolve([]),
    enabled: Boolean(apiProduct?.category_id),
  });
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "details">("description");

  if (!product) {
    return (
      <Layout>
        <div className="container py-20 text-center text-muted-foreground">Product not found.</div>
      </Layout>
    );
  }

  const related = relatedApi
    .filter((relatedProduct) => relatedProduct.id !== apiProduct?.id)
    .slice(0, 4)
    .map((relatedProduct) => toCatalogProduct(relatedProduct, productCategory));

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    addItem(product, selectedSize, quantity);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to={`/category/${product.category}`} className="hover:text-primary transition-colors capitalize">{product.category}</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Image */}
          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {product.badge && (
              <span className="inline-block bg-gold-gradient text-primary-foreground text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-sm w-fit mb-4">
                {product.badge}
              </span>
            )}
            <h1 className="font-serif text-2xl md:text-3xl text-foreground mb-2">{product.name}</h1>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xl font-semibold text-primary">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
              )}
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{product.description}</p>

            {/* Size */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[44px] px-3 py-2 text-sm rounded-md border transition-colors ${
                      selectedSize === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:border-primary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Quantity</h3>
              <div className="inline-flex items-center border border-border rounded-md">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 text-foreground hover:text-primary transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-medium text-foreground">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2.5 text-foreground hover:text-primary transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-gold-gradient text-primary-foreground px-6 py-3.5 rounded-md text-sm font-medium tracking-wide hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Add to Cart
              </button>
              <button className="p-3.5 border border-border rounded-md text-muted-foreground hover:text-primary hover:border-primary transition-colors" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-t border-border pt-6">
              <div className="flex gap-6 mb-4">
                {(["description", "details"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-sm font-medium capitalize pb-2 border-b-2 transition-colors ${
                      activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {activeTab === "description" ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              ) : (
                <ul className="space-y-2">
                  {product.details.map((d) => (
                    <li key={d} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16 md:mt-24">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default ProductPage;
