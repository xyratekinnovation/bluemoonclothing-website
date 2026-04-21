import { Link } from "react-router-dom";
import { useMemo } from "react";
import { ArrowRight, Diamond, Heart, Palette, Crown, ImageIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import heroBanner from "@/assets/hero-banner.jpg";
import categoryMen from "@/assets/category-men.jpg";
import categoryWomen from "@/assets/category-women.jpg";
import categoryKids from "@/assets/category-kids.jpg";
import { apiGet, resolvePublicAssetUrl, type ApiCategory, type ApiProduct } from "@/lib/api";
import { toCatalogProduct } from "@/types/catalog";

/** Fixed order for the main “Shop by category” row (top-level only). */
const MAIN_SHOP_SLUGS = ["men", "women", "kids"] as const;

function fallbackMainCategoryImage(slug: string): string {
  if (slug === "men") return categoryMen;
  if (slug === "women") return categoryWomen;
  if (slug === "kids") return categoryKids;
  return categoryMen;
}

const features = [
  { icon: Crown, title: "Premium Quality", description: "Crafted from the finest fabrics sourced globally" },
  { icon: Heart, title: "Comfortable Fit", description: "Designed to feel as good as it looks" },
  { icon: Palette, title: "Modern Designs", description: "Contemporary styles for the conscious individual" },
  { icon: Diamond, title: "Affordable Luxury", description: "Premium fashion without the premium price" },
];

const Index = () => {
  const { data: categoriesData = [], isPending: categoriesPending, dataUpdatedAt: categoriesDU } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<ApiCategory[]>("/categories"),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 20_000,
  });
  const { data: featuredProducts = [], isPending: featuredPending, dataUpdatedAt: featuredDU } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => apiGet<ApiProduct[]>("/products?featured=true&limit=4"),
    staleTime: 60_000,
  });
  const { data: heroBannerApi, isPending: heroPending, dataUpdatedAt: heroDU } = useQuery({
    queryKey: ["hero-banner"],
    queryFn: () => apiGet<{ desktop_url: string | null; mobile_url: string | null }>("/storefront/hero-banner"),
    staleTime: 60_000,
  });

  const heroDesktopSrc =
    resolvePublicAssetUrl(heroBannerApi?.desktop_url ?? undefined, heroDU) ?? heroBanner;
  const heroMobileSrc =
    resolvePublicAssetUrl(heroBannerApi?.mobile_url ?? undefined, heroDU) ?? heroDesktopSrc;

  const shopByMainCategories = useMemo(() => {
    return MAIN_SHOP_SLUGS.map((slug) => {
      const cat = categoriesData.find(
        (c) => c.slug.toLowerCase() === slug && c.parent_id === null,
      );
      if (!cat) return null;
      const uploaded = resolvePublicAssetUrl(cat.image_url ?? undefined, categoriesDU);
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        imageSrc: uploaded ?? fallbackMainCategoryImage(slug),
      };
    }).filter(Boolean) as { id: string; name: string; slug: string; imageSrc: string }[];
  }, [categoriesData, categoriesDU]);

  /** Leaf categories only; admin can turn off “Home row” per leaf without deactivating the category. */
  const topSubCategories = useMemo(() => {
    const hasChildren = (id: string) => categoriesData.some((x) => x.parent_id === id);
    return categoriesData
      .filter(
        (c) =>
          c.parent_id !== null &&
          !hasChildren(c.id) &&
          (c.show_on_home === undefined || c.show_on_home === true),
      )
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageSrc: resolvePublicAssetUrl(c.image_url ?? undefined, categoriesDU),
      }));
  }, [categoriesData, categoriesDU]);

  return (
    <Layout>
    {/* Hero: full-bleed cover reads sharper than letterboxed contain; anchor right+top for wide art with subject on the right */}
    <section className="relative overflow-hidden min-h-[70vh] md:min-h-[80vh] flex items-center bg-secondary">
      <div className="absolute inset-0 z-0 isolate overflow-hidden">
        {heroPending ? (
          <div className="absolute inset-0 bg-muted animate-pulse" aria-hidden />
        ) : (
          <picture className="absolute inset-0 block">
            <source media="(max-width: 767px)" srcSet={heroMobileSrc} />
            <img
              src={heroDesktopSrc}
              alt=""
              fetchPriority="high"
              className="hero-banner-media absolute inset-0 h-full w-full object-cover max-md:object-[center_top] md:object-[right_top]"
            />
          </picture>
        )}
      </div>
      {/* Mobile: scrim behind copy; long soft falloff avoids a harsh band over the photo */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none md:hidden"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--background) / 0.9) 0%, hsl(var(--background) / 0.42) 36%, hsl(var(--background) / 0.12) 58%, transparent 78%)",
        }}
        aria-hidden
      />
      {/* Desktop: wide soft blend into the photo (no hard vertical edge); subject stays mostly untouched on the right */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, hsl(var(--background) / 0.98) 0%, hsl(var(--background) / 0.72) 8%, hsl(var(--background) / 0.38) 18%, hsl(var(--background) / 0.14) 32%, hsl(var(--background) / 0.04) 44%, transparent 62%)",
        }}
        aria-hidden
      />
      <div className="container relative z-10 py-12 md:py-16">
        <div className="max-w-xl animate-fade-in-left [text-shadow:0_1px_2px_hsl(var(--background)/0.8)]" style={{ animationDelay: "0.1s" }}>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary mb-4">New Collection 2026</p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight text-foreground mb-6">
            Every Fit Feels<br />
            Like a <span className="text-gold-dark font-semibold">Blue Moon</span>
          </h1>
          <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
            Discover timeless elegance with Bluemoon's latest collection — where premium quality meets modern design.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/category/men"
              className="bg-gold-gradient text-primary-foreground px-6 py-3 rounded-md text-sm font-medium tracking-wide hover:opacity-90 transition-opacity inline-flex items-center justify-center"
            >
              Shop Men
            </Link>
            <Link to="/category/women" className="border border-foreground text-foreground px-6 py-3 rounded-md text-sm font-medium tracking-wide hover:bg-foreground hover:text-background transition-colors">
              Shop Women
            </Link>
            <Link
              to="/category/kids"
              className="bg-gold-gradient text-primary-foreground px-6 py-3 rounded-md text-sm font-medium tracking-wide hover:opacity-90 transition-opacity inline-flex items-center justify-center"
            >
              Shop Kids
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* Shop by category — Men, Women, Kids only */}
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-3">Shop by Category</h2>
          <p className="text-muted-foreground text-sm">Men, Women &amp; Kids</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {categoriesPending
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-lg bg-muted animate-pulse" />
              ))
            : shopByMainCategories.length > 0 ? (
                shopByMainCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="group relative aspect-[4/3] rounded-lg overflow-hidden"
                  >
                    <img
                      src={cat.imageSrc}
                      alt={cat.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" />
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-gold rounded-lg transition-colors duration-300" />
                    <div className="absolute bottom-6 left-6">
                      <h3 className="font-serif text-2xl text-background mb-1">{cat.name}</h3>
                      <span className="text-xs text-gold font-medium tracking-wider uppercase inline-flex items-center gap-1">
                        Explore <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="col-span-full text-center text-sm text-muted-foreground py-8">
                  Add top-level categories with slugs <strong className="text-foreground">men</strong>,{" "}
                  <strong className="text-foreground">women</strong>, and <strong className="text-foreground">kids</strong>{" "}
                  in the admin.
                </p>
              )}
        </div>
      </div>
    </section>

    {/* Top categories — subcategories (under Men / Women / Kids) */}
    {(categoriesPending || topSubCategories.length > 0) && (
      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-3">Top categories</h2>
            <p className="text-muted-foreground text-sm">Shop our collections</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {categoriesPending
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] rounded-lg bg-muted animate-pulse" />
                ))
              : topSubCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="group relative aspect-[4/3] rounded-lg overflow-hidden bg-muted"
                  >
                    {cat.imageSrc ? (
                      <img
                        src={cat.imageSrc}
                        alt={cat.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-secondary">
                        <ImageIcon className="w-10 h-10 opacity-40" />
                        <span className="text-xs font-medium px-2 text-center">{cat.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" />
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-gold rounded-lg transition-colors duration-300" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-serif text-lg md:text-xl text-background leading-tight">{cat.name}</h3>
                      <span className="text-[10px] text-gold font-medium tracking-wider uppercase inline-flex items-center gap-1 mt-1">
                        Explore <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>
    )}

    {/* Featured Products */}
    <section className="py-16 md:py-24 bg-secondary/50">
      <div className="container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-2">Featured</h2>
            <p className="text-muted-foreground text-sm">Handpicked essentials for you</p>
          </div>
          <Link to="/category/men" className="hidden md:inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:overflow-visible md:justify-items-center">
          {featuredPending
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[42vw] sm:min-w-[30vw] md:min-w-0 w-full max-w-[12rem] space-y-2">
                  <div className="aspect-[3/4] max-h-[13rem] rounded-lg bg-muted animate-pulse mx-auto" />
                  <div className="h-3 w-2/3 bg-muted rounded animate-pulse mx-auto" />
                  <div className="h-3 w-1/3 bg-muted rounded animate-pulse mx-auto" />
                </div>
              ))
            : featuredProducts.map((p) => (
                <div key={p.id} className="min-w-[42vw] sm:min-w-[30vw] md:min-w-0 flex justify-center shrink-0 md:shrink">
                  <ProductCard product={toCatalogProduct(p, "all", featuredDU)} compact />
                </div>
              ))}
        </div>
      </div>
    </section>

    {/* Why Bluemoon */}
    <section className="py-16 md:py-24">
      <div className="container">
        <h2 className="font-serif text-3xl md:text-4xl text-foreground text-center mb-12">Why Bluemoon</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-2">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Newsletter */}
    <section className="py-16 md:py-24 bg-charcoal">
      <div className="container max-w-lg text-center">
        <h2 className="font-serif text-3xl text-background mb-3">Stay in the Loop</h2>
        <p className="text-sm text-muted-foreground mb-8">Be the first to know about new drops and exclusive offers.</p>
        <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="Your email address"
            className="flex-1 bg-charcoal-light border border-charcoal-light rounded-md px-4 py-3 text-sm text-background placeholder:text-muted-foreground focus:outline-none focus:border-gold transition-colors"
          />
          <button className="bg-gold-gradient text-primary-foreground px-6 py-3 rounded-md text-sm font-medium tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  </Layout>
  );
};

export default Index;
