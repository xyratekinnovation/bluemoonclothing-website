import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ShoppingBag, Heart } from "lucide-react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { apiGet, type ApiCategory, type ApiProduct } from "@/lib/api";
import { toCatalogProduct } from "@/types/catalog";

function normSize(v: { size: string | null }): string {
  return v.size?.trim() ? v.size.trim() : "One size";
}

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addVariant } = useCart();
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<ApiCategory[]>("/categories"),
    staleTime: 120_000,
  });
  const {
    data: apiProduct,
    isPending: productPending,
    isError: productError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => apiGet<ApiProduct>(`/products/${id}`),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
  const productCategory = categories.find((category) => category.id === apiProduct?.category_id)?.slug ?? "all";
  const product = apiProduct ? toCatalogProduct(apiProduct, productCategory) : undefined;
  const { data: relatedApi = [], isPending: relatedPending } = useQuery({
    queryKey: ["related", productCategory, id],
    queryFn: () =>
      apiProduct?.category_id
        ? apiGet<ApiProduct[]>(`/products?category_id=${apiProduct.category_id}&limit=8`)
        : Promise.resolve([]),
    enabled: Boolean(apiProduct?.category_id),
    staleTime: 60_000,
  });

  const sizeOptions = useMemo(() => {
    if (!apiProduct?.variants.length) return [] as string[];
    return Array.from(new Set(apiProduct.variants.map((v) => normSize(v))));
  }, [apiProduct]);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "details">("description");

  useEffect(() => {
    if (sizeOptions.length === 0) return;
    setSelectedSize((prev) => (prev && sizeOptions.includes(prev) ? prev : sizeOptions[0]));
  }, [sizeOptions]);

  const colorsForSize = useMemo(() => {
    if (!apiProduct || !selectedSize) return [] as string[];
    return Array.from(
      new Set(
        apiProduct.variants
          .filter((v) => normSize(v) === selectedSize)
          .map((v) => (v.color ?? "").trim())
          .filter(Boolean),
      ),
    );
  }, [apiProduct, selectedSize]);

  useEffect(() => {
    if (colorsForSize.length === 0) {
      setSelectedColor("");
      return;
    }
    setSelectedColor((prev) => (prev && colorsForSize.includes(prev) ? prev : colorsForSize[0]));
  }, [colorsForSize]);

  const selectedVariant = useMemo(() => {
    if (!apiProduct || !selectedSize) return undefined;
    const matchSize = apiProduct.variants.filter((v) => normSize(v) === selectedSize);
    if (colorsForSize.length > 0) {
      return matchSize.find((v) => (v.color ?? "").trim() === selectedColor);
    }
    return matchSize[0];
  }, [apiProduct, selectedSize, selectedColor, colorsForSize.length]);

  if (productPending || !id) {
    return (
      <Layout>
        <div className="container py-8 md:py-12">
          <div className="h-4 w-48 bg-muted rounded animate-pulse mb-8" />
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className="aspect-[3/4] rounded-lg bg-muted animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-6 w-1/3 bg-muted rounded animate-pulse" />
              <div className="h-20 w-full bg-muted rounded animate-pulse" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 w-12 bg-muted rounded-md animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (productError || !apiProduct || !product) {
    return (
      <Layout>
        <div className="container py-20 text-center text-muted-foreground">Product not found.</div>
      </Layout>
    );
  }

  const related = relatedApi
    .filter((relatedProduct) => relatedProduct.id !== apiProduct.id)
    .slice(0, 4)
    .map((relatedProduct) => toCatalogProduct(relatedProduct, productCategory));

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (colorsForSize.length > 0 && !selectedColor) {
      toast.error("Please select a color");
      return;
    }
    const isLoggedIn = Boolean(localStorage.getItem("access_token"));
    if (!isLoggedIn) {
      toast.error("Please login to add items to cart");
      navigate(`/login?returnTo=${encodeURIComponent("/cart")}`);
      return;
    }
    if (!selectedVariant) {
      toast.error("This combination is not available");
      return;
    }
    addVariant(selectedVariant.id, quantity)
      .then(() => toast.success(`${product.name} added to cart`))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Unable to add to cart"));
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to={`/category/${product.category}`} className="hover:text-primary transition-colors capitalize">{product.category}</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>

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

            {sizeOptions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
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
            )}

            {colorsForSize.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Color</h3>
                <div className="flex flex-wrap gap-2">
                  {colorsForSize.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                        selectedColor === c
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:border-primary"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Quantity</h3>
              <div className="inline-flex items-center border border-border rounded-md">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 text-foreground hover:text-primary transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-medium text-foreground">{quantity}</span>
                <button type="button" onClick={() => setQuantity(quantity + 1)} className="p-2.5 text-foreground hover:text-primary transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mb-8">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 bg-gold-gradient text-primary-foreground px-6 py-3.5 rounded-md text-sm font-medium tracking-wide hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Add to Cart
              </button>
              <button type="button" className="p-3.5 border border-border rounded-md text-muted-foreground hover:text-primary hover:border-primary transition-colors" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
              </button>
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex gap-6 mb-4">
                {(["description", "details"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
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

        <section className="mt-16 md:mt-24">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-8">You May Also Like</h2>
          {relatedPending ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[4/5] rounded-lg bg-muted animate-pulse" />
                  <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : related.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No related products yet.</p>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default ProductPage;
