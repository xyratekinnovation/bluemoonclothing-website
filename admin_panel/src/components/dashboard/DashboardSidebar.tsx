import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, FolderTree, Package, Users,
  CreditCard, Settings,
  Shield, ChevronLeft, ChevronRight, ImageIcon,
} from "lucide-react";
import logo from "@/assets/bluemoon-logo.png";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Products", icon: ShoppingBag, path: "/dashboard/products" },
  { label: "Categories", icon: FolderTree, path: "/dashboard/categories" },
  { label: "Orders", icon: Package, path: "/dashboard/orders" },
  { label: "Customers", icon: Users, path: "/dashboard/customers" },
  { label: "Payments", icon: CreditCard, path: "/dashboard/payments" },
  { label: "Hero banner", icon: ImageIcon, path: "/dashboard/hero-banner" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
  { label: "Access Control", icon: Shield, path: "/dashboard/access-control" },
];

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function DashboardSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: DashboardSidebarProps) {
  const sidebarContent = (
    <div className={`flex flex-col h-full bg-sidebar text-sidebar-foreground transition-all duration-300 ${collapsed ? "w-[72px]" : "w-64"}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <img src={logo} alt="Bluemoon" className="w-9 h-9 rounded-lg object-cover" />
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold text-sidebar-primary">BLUEMOON</h1>
            <p className="text-[10px] text-sidebar-muted tracking-widest">CLOTHING</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                ${isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }
                ${collapsed ? "justify-center" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-accent-foreground"}`}
                  />
                  {!collapsed && <span className="animate-fade-in">{item.label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle - desktop only */}
      <button
        onClick={onToggle}
        className="hidden lg:flex items-center justify-center py-4 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/40 z-40 lg:hidden" onClick={onMobileClose} />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        {sidebarContent}
      </div>
    </>
  );
}
