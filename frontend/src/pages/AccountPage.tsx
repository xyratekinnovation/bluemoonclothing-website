import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package, User, MapPin } from "lucide-react";
import Layout from "@/components/Layout";
import { apiGet } from "@/lib/api";

const tabs = [
  { id: "orders", label: "Orders", icon: Package },
  { id: "profile", label: "Profile", icon: User },
] as const;

const AccountPage = () => {
  const [activeTab, setActiveTab] = useState<string>("orders");
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem("access_token"));
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<{ name: string; email: string }>("/auth/me", true),
    enabled: isLoggedIn,
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const result = await apiGet<any[]>("/orders", true);
      return result.map((order) => ({
        id: order.order_number,
        date: order.created_at ? new Date(order.created_at).toLocaleDateString() : "-",
        status: `${order.status}`.charAt(0).toUpperCase() + `${order.status}`.slice(1),
        total: Number(order.grand_total),
        items: order.items.length,
      }));
    },
    enabled: isLoggedIn,
  });

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-3xl">
        <div className="flex items-center justify-between gap-4 mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">My Account</h1>
          <button
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            onClick={() => {
              localStorage.removeItem("access_token");
              navigate("/login", { replace: true });
            }}
          >
            Log out
          </button>
        </div>

        <div className="flex gap-4 mb-8 border-b border-border">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-border rounded-lg p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{order.id}</span>
                    <span className="text-xs text-muted-foreground ml-3">{order.date}</span>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    order.status === "Delivered" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{order.items} item{order.items > 1 ? "s" : ""}</span>
                  <span className="font-semibold text-foreground">₹{order.total.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="border border-border rounded-lg p-5 text-sm text-muted-foreground">
                No orders found for this account.
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{me?.name ?? "Guest User"}</h3>
                  <p className="text-sm text-muted-foreground">{me?.email ?? "guest@bluemoon.com"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span>No address saved yet</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AccountPage;
