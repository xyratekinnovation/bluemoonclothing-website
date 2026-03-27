import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Menu, X, Search, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/context/CartContext";
import logo from "@/assets/logo.png";
import { apiGet, type ApiCategory } from "@/lib/api";

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

  const topParents = useMemo(() => {
    const bySlug = new Map(parentCategories.map((c) => [c.slug.toLowerCase(), c]));
    const picks: ApiCategory[] = [];
    for (const slug of ["men", "women", "kids"]) {
      const c = bySlug.get(slug);
      if (c) picks.push(c);
    }
    return picks;
  }, [parentCategories]);

  return (
    <header className="sticky top-0 z-50">
      {/* Top header (logo + icons) */}
      <div className="bg-background/95 backdrop-blur-md border-b border-border">
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
            <span className="hidden sm:block font-serif text-lg tracking-wide text-foreground">Bluemoon</span>
          </Link>

          {/* Icons */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-muted-foreground hover:text-primary transition-colors" aria-label="Search">
              <Search className="w-5 h-5" />
            </button>
            <Link
              to={isLoggedIn ? "/account" : "/login"}
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Account"
            >
              <User className="w-5 h-5" />
            </Link>
            <Link
              to="/cart"
              className="p-2 text-muted-foreground hover:text-primary transition-colors relative"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Separate menu bar (desktop) */}
      <div className="hidden md:block bg-background border-b border-border">
        <div className="container relative">
          <nav className="flex items-center gap-10 h-12" onMouseLeave={() => setActiveParent(null)}>
            <Link to="/" className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            {topParents.map((parent) => (
              <div key={parent.id} className="h-full flex items-center">
                <Link
                  to={`/category/${parent.slug}`}
                  onMouseEnter={() => setActiveParent(parent.id)}
                  className={`text-sm font-semibold transition-colors ${
                    activeParent === parent.id ? "text-primary" : "text-foreground hover:text-primary"
                  }`}
                >
                  {parent.name}
                </Link>
              </div>
            ))}
          </nav>

          {/* Hover dropdown (absolute overlay, does NOT push layout) */}
          {activeParent && (
            <div className="absolute left-0 right-0 top-full z-50">
              <div className="mt-2 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between border-b border-border">
                  {(() => {
                    const parent = topParents.find((p) => p.id === activeParent);
                    return (
                      <>
                        <div className="text-sm font-semibold text-foreground">{parent?.name}</div>
                        {parent ? (
                          <Link to={`/category/${parent.slug}`} className="text-xs text-primary hover:underline">
                            View all
                          </Link>
                        ) : null}
                      </>
                    );
                  })()}
                </div>
                <div className="p-6">
                  {(() => {
                    const children = categoryChildrenMap.get(activeParent) ?? [];
                    if (children.length === 0) {
                      return <div className="text-sm text-muted-foreground">No categories yet.</div>;
                    }
                    const cols = 4;
                    const perCol = Math.ceil(children.length / cols);
                    return (
                      <div className="grid grid-cols-4 gap-8">
                        {Array.from({ length: cols }).map((_, i) => {
                          const chunk = children.slice(i * perCol, i * perCol + perCol);
                          if (chunk.length === 0) return <div key={i} />;
                          return (
                            <div key={i} className="space-y-2">
                              {chunk.map((c) => (
                                <Link
                                  key={c.id}
                                  to={`/category/${c.slug}`}
                                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                  {c.name}
                                </Link>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
