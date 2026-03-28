import { Link } from "react-router-dom";
import { ArrowRight, Diamond, Heart, Palette, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import heroBanner from "@/assets/hero-banner.jpg";
import categoryMen from "@/assets/category-men.jpg";
import categoryWomen from "@/assets/category-women.jpg";
import categoryKids from "@/assets/category-kids.jpg";
import { apiGet, resolvePublicAssetUrl, type ApiCategory, type ApiProduct } from "@/lib/api";
import { toCatalogProduct } from "@/types/catalog";

const categories = [
  { name: "Men", slug: "men", image: categoryMen },
  { name: "Women", slug: "women", image: categoryWomen },
  { name: "Kids", slug: "kids", image: categoryKids },
];

const features = [
  { icon: Crown, title: "Premium Quality", description: "Crafted from the finest fabrics sourced globally" },
  { icon: Heart, title: "Comfortable Fit", description: "Designed to feel as good as it looks" },
  { icon: Palette, title: "Modern Designs", description: "Contemporary styles for the conscious individual" },
  { icon: Diamond, title: "Affordable Luxury", description: "Premium fashion without the premium price" },
];

const Index = () => {
  const { data: categoriesData = [], isPending: categoriesPending } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<ApiCategory[]>("/categories"),
    staleTime: 120_000,
  });
  const { data: featuredProducts = [], isPending: featuredPending } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => apiGet<ApiProduct[]>("/products?featured=true&limit=4"),
    staleTime: 60_000,
  });
  const { data: heroBannerApi } = useQuery({
    queryKey: ["hero-banner"],
    queryFn: () => apiGet<{ desktop_url: string | null; mobile_url: string | null }>("/storefront/hero-banner"),
    staleTime: 60_000,
  });

  const heroDesktopSrc =
    resolvePublicAssetUrl(heroBannerApi?.desktop_url ?? undefined) ?? heroBanner;
  const heroMobileSrc =
    resolvePublicAssetUrl(heroBannerApi?.mobile_url ?? undefined) ?? heroDesktopSrc;

  const displayCategories = categoriesData.length > 0 ? categoriesData.map((category) => ({
    name: category.name,
    slug: category.slug,
    image:
      category.slug === "men"
        ? categoryMen
        : category.slug === "women"
          ? categoryWomen
          : category.slug === "kids"
            ? categoryKids
            : categoryMen,
  })) : categories;

  return (
    <Layout>
    {/* Hero: object-contain = full artwork visible (no cover crop). Scrim only behind text, not over the whole photo. */}
    <section className="relative overflow-hidden min-h-[70vh] md:min-h-[80vh] flex items-center bg-secondary">
      <div className="absolute inset-0 z-0">
        <picture className="absolute inset-0 block">
          <source media="(max-width: 767px)" srcSet={heroMobileSrc} />
          <img
            src={heroDesktopSrc}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-contain object-center"
          />
        </picture>
      </div>
      {/* Mobile: light scrim only behind top copy; most of the photo stays full strength */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none md:hidden"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--background) / 0.88) 0%, hsl(var(--background) / 0.35) 42%, transparent 68%)",
        }}
        aria-hidden
      />
      {/* Desktop: strong fade only on the left (text column); right ~half stays clear for the subject */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, hsl(var(--background) / 0.97) 0%, hsl(var(--background) / 0.55) 14%, hsl(var(--background) / 0.18) 30%, transparent 48%)",
        }}
        aria-hidden
      />
      <div className="container relative z-10 py-12 md:py-16">
        <div className="max-w-xl animate-fade-in-left [text-shadow:0_1px_2px_hsl(var(--background)/0.8)]" style={{ animationDelay: "0.1s" }}>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-primary mb-4">New Collection 2026</p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight text-foreground mb-6">
            Every Fit Feels<br />
            Like a <span className="text-gold-gradient">Blue Moon</span>
          </h1>
          <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
            Discover timeless elegance with Bluemoon's latest collection — where premium quality meets modern design.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/category/men" className="bg-gold-gradient text-primary-foreground px-6 py-3 rounded-md text-sm font-medium tracking-wide hover:opacity-90 transition-opacity inline-flex items-center gap-2">
              Shop Men <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/category/women" className="border border-foreground text-foreground px-6 py-3 rounded-md text-sm font-medium tracking-wide hover:bg-foreground hover:text-background transition-colors">
              Shop Women
            </Link>
            <Link to="/category/kids" className="border border-border text-muted-foreground px-6 py-3 rounded-md text-sm font-medium tracking-wide hover:border-primary hover:text-primary transition-colors">
              Shop Kids
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* Categories */}
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-3">Shop by Category</h2>
          <p className="text-muted-foreground text-sm">Find your perfect fit</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {categoriesPending
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-lg bg-muted animate-pulse" />
              ))
            : displayCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  className="group relative aspect-[4/3] rounded-lg overflow-hidden"
                >
                  <img src={cat.image} alt={cat.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" />
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-gold rounded-lg transition-colors duration-300" />
                  <div className="absolute bottom-6 left-6">
                    <h3 className="font-serif text-2xl text-background mb-1">{cat.name}</h3>
                    <span className="text-xs text-gold font-medium tracking-wider uppercase inline-flex items-center gap-1">
                      Explore <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>

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
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:overflow-visible">
          {featuredPending
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[52vw] sm:min-w-[34vw] md:min-w-0 space-y-3">
                  <div className="aspect-[4/5] rounded-lg bg-muted animate-pulse" />
                  <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                </div>
              ))
            : featuredProducts.map((p) => (
                <div key={p.id} className="min-w-[52vw] sm:min-w-[34vw] md:min-w-0">
                  <ProductCard product={toCatalogProduct(p)} />
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
