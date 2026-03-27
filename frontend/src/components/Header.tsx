import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Menu, X, Search, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/context/CartContext";
import logo from "@/assets/logo.png";
import { apiGet, type ApiCategory } from "@/lib/api";
import categoryMen from "@/assets/category-men.jpg";
import categoryWomen from "@/assets/category-women.jpg";
import categoryKids from "@/assets/category-kids.jpg";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeParent, setActiveParent] = useState<string | null>(null);
  const { totalItems } = useCart();
  const isLoggedIn = Boolean(localStorage.getItem("access_token"));
  const { data: categories = [] } = useQuery({
    queryKey: ["header-categories"],
    queryFn: () => apiGet<ApiCategory[]>("/categories?active_only=true"),
  });

  const parentCategories = useMemo(
    () => categories.filter((c) => c.parent_id == null).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    [categories]
  );
  const categoryChildrenMap = useMemo(() => {
    const map = new Map<string, ApiCategory[]>();
    for (const parent of parentCategories) {
      map.set(
        parent.id,
        categories
          .filter((c) => c.parent_id === parent.id)
          .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      );
    }
    return map;
  }, [categories, parentCategories]);

  const categoryImage = (slug: string, imageUrl: string | null, fallback: string) => {
    if (imageUrl && imageUrl.trim().length > 0) return imageUrl;
    if (slug.includes("men")) return categoryMen;
    if (slug.includes("women")) return categoryWomen;
    if (slug.includes("kids")) return categoryKids;
    return fallback;
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16 md:h-20">
        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Bluemoon Clothing" className="h-10 md:h-12 w-auto" />
          <span className="hidden sm:block font-serif text-lg tracking-wide text-foreground">
            Bluemoon
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden md:flex items-center gap-6 h-full"
          onMouseLeave={() => setActiveParent(null)}
        >
          {parentCategories.map((parent) => (
            <div key={parent.id} className="h-full flex items-center">
              <Link
                to={`/category/${parent.slug}`}
                onMouseEnter={() => setActiveParent(parent.id)}
                className={`text-sm font-medium tracking-wide transition-colors ${
                  activeParent === parent.id ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
              >
                {parent.name}
              </Link>
            </div>
          ))}
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-3">
          <button className="p-2 text-muted-foreground hover:text-primary transition-colors" aria-label="Search">
            <Search className="w-5 h-5" />
          </button>
          <Link to={isLoggedIn ? "/account" : "/login"} className="p-2 text-muted-foreground hover:text-primary transition-colors" aria-label="Account">
            <User className="w-5 h-5" />
          </Link>
          <Link to="/cart" className="p-2 text-muted-foreground hover:text-primary transition-colors relative" aria-label="Cart">
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Desktop mega menu */}
      {activeParent && (
        <div className="hidden md:block border-t border-border bg-background/95 backdrop-blur-md shadow-md">
          <div className="container py-5">
            {(() => {
              const parent = parentCategories.find((c) => c.id === activeParent);
              const children = categoryChildrenMap.get(activeParent) ?? [];
              if (!parent) return null;
              return (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
                      {parent.name} Collections
                    </h3>
                    <Link to={`/category/${parent.slug}`} className="text-xs text-primary hover:underline">
                      View all
                    </Link>
                  </div>

                  <div className="grid grid-cols-6 gap-3">
                    {children.slice(0, 6).map((child) => (
                      <Link
                        key={child.id}
                        to={`/category/${child.slug}`}
                        className="group rounded-md border border-border overflow-hidden bg-card hover:border-primary/40 transition-colors"
                      >
                        <div className="h-20 bg-secondary overflow-hidden">
                          <img
                            src={categoryImage(child.slug, child.image_url, categoryImage(parent.slug, parent.image_url, "/placeholder.svg"))}
                            alt={child.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="px-2 py-1.5 text-[11px] text-center font-medium text-foreground line-clamp-1">
                          {child.name}
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-6">
                    {Array.from({ length: Math.max(1, Math.ceil(children.length / 8)) }).map((_, idx) => {
                      const chunk = children.slice(idx * 8, idx * 8 + 8);
                      if (chunk.length === 0) return null;
                      return (
                        <div key={idx}>
                          <p className="text-xs font-semibold tracking-wide mb-2 text-foreground">
                            {idx === 0 ? `${parent.name.toUpperCase()} CATEGORIES` : "MORE"}
                          </p>
                          <div className="space-y-1">
                            {chunk.map((item) => (
                              <Link
                                key={item.id}
                                to={`/category/${item.slug}`}
                                className="block text-xs text-muted-foreground hover:text-primary transition-colors"
                              >
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="container py-4 flex flex-col gap-4">
            {(parentCategories.length > 0
              ? parentCategories
              : [
                  { id: "men", slug: "men", name: "Men" },
                  { id: "women", slug: "women", name: "Women" },
                  { id: "kids", slug: "kids", name: "Kids" },
                ]
            ).map((parent) => (
              <Link
                key={parent.id}
                to={`/category/${parent.slug}`}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium tracking-wide py-2 text-foreground"
              >
                {parent.name}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
