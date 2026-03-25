import { Link, useLocation } from "react-router-dom";
import { Home, Grid3X3, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/context/CartContext";

const MobileNav = () => {
  const location = useLocation();
  const { totalItems } = useCart();

  const links = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/category/men", icon: Grid3X3, label: "Shop" },
    { to: "/cart", icon: ShoppingBag, label: "Cart", badge: totalItems },
    { to: "/account", icon: User, label: "Profile" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around h-16">
        {links.map(({ to, icon: Icon, label, badge }) => {
          const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 relative transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
              {badge ? (
                <span className="absolute -top-1 right-0 bg-primary text-primary-foreground text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
