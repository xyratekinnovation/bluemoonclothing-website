import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Menu, X, Search, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import logo from "@/assets/logo.png";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();

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
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/category/men" className="text-sm font-medium tracking-wide text-muted-foreground hover:text-primary transition-colors">
            Men
          </Link>
          <Link to="/category/women" className="text-sm font-medium tracking-wide text-muted-foreground hover:text-primary transition-colors">
            Women
          </Link>
          <Link to="/category/kids" className="text-sm font-medium tracking-wide text-muted-foreground hover:text-primary transition-colors">
            Kids
          </Link>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-3">
          <button className="p-2 text-muted-foreground hover:text-primary transition-colors" aria-label="Search">
            <Search className="w-5 h-5" />
          </button>
          <Link to="/account" className="p-2 text-muted-foreground hover:text-primary transition-colors" aria-label="Account">
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

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="container py-4 flex flex-col gap-4">
            <Link to="/category/men" onClick={() => setMenuOpen(false)} className="text-sm font-medium tracking-wide py-2 text-foreground">Men</Link>
            <Link to="/category/women" onClick={() => setMenuOpen(false)} className="text-sm font-medium tracking-wide py-2 text-foreground">Women</Link>
            <Link to="/category/kids" onClick={() => setMenuOpen(false)} className="text-sm font-medium tracking-wide py-2 text-foreground">Kids</Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
