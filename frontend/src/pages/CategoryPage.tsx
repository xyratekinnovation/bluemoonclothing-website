import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { apiGet, type ApiCategory, type ApiProduct } from "@/lib/api";
import { toCatalogProduct } from "@/types/catalog";

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const sortOptions = ["Newest", "Price: Low to High", "Price: High to Low"];

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState(sortOptions[0]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<ApiCategory[]>("/categories"),
  });
  const activeCategory = categories.find((category) => category.slug === slug);
  const { data: products = [] } = useQuery({
    queryKey: ["products", slug],
    queryFn: () =>
      activeCategory
        ? apiGet<ApiProduct[]>(`/products?category_id=${activeCategory.id}&limit=100`)
        : apiGet<ApiProduct[]>("/products?limit=100"),
    enabled: Boolean(activeCategory) || !slug,
  });

  const categoryName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "All";
  let filtered = products.map((product) => toCatalogProduct(product, slug ?? "all"));

  if (selectedSize) filtered = filtered.filter((p) => p.sizes.includes(selectedSize));

  if (sortBy === "Price: Low to High") filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === "Price: High to Low") filtered = [...filtered].sort((a, b) => b.price - a.price);

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground">{categoryName}</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">{categoryName}</h1>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="hidden md:block text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {sortOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
            <button
              className="md:hidden flex items-center gap-2 text-sm border border-border rounded-md px-3 py-2 text-foreground"
              onClick={() => setFilterOpen(true)}
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-56 shrink-0">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        selectedSize === s
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-20">No products found.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setFilterOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-background p-6 animate-fade-in overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Filters</h3>
              <button onClick={() => setFilterOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="mb-6">
              <h4 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Sort</h4>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground"
              >
                {sortOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">Size</h4>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                      selectedSize === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CategoryPage;
