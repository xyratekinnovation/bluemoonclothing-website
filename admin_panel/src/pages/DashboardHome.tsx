import { DollarSign, ShoppingCart, Users, CreditCard, AlertTriangle, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import MetricCard from "@/components/dashboard/MetricCard";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";

const statusColor = (s: string) => {
  switch (s) {
    case "Delivered": return "bg-success/10 text-success border-0";
    case "Shipped": return "bg-info/10 text-info border-0";
    case "Paid": return "bg-gold-light text-gold-dark border-0";
    case "Pending": return "bg-warning/10 text-warning border-0";
    case "Cancelled": return "bg-destructive/10 text-destructive border-0";
    default: return "";
  }
};

export default function DashboardHome() {
  const { data } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => apiGet<any>("/analytics/overview"),
    staleTime: 60_000,
  });
  const metrics = data?.metrics;
  const recentOrdersData = data?.recent_orders ?? [];
  const lowStockData = data?.low_stock ?? [];
  const topProductsData = data?.top_products ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground text-sm">Welcome back, here's what's happening today.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard title="Total Revenue" value={`₹${Number(metrics?.total_revenue ?? 0).toLocaleString()}`} change="Live data" changeType="positive" icon={<DollarSign className="w-5 h-5" />} />
        <MetricCard title="Total Orders" value={`${metrics?.total_orders ?? 0}`} change="Live data" changeType="positive" icon={<ShoppingCart className="w-5 h-5" />} />
        <MetricCard title="Total Customers" value={`${metrics?.total_customers ?? 0}`} change="Live data" changeType="positive" icon={<Users className="w-5 h-5" />} />
        <MetricCard title="Avg. Order Value" value={`₹${Number(metrics?.avg_order_value ?? 0).toLocaleString()}`} change="Live data" changeType="positive" icon={<CreditCard className="w-5 h-5" />} />
      </div>

      {/* Live lists only (no mock charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="text-sm font-semibold mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {recentOrdersData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              recentOrdersData.slice(0, 6).map((o: any) => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{o.id}</p>
                    <p className="text-xs text-muted-foreground">{o.date}</p>
                  </div>
                  <Badge className={statusColor(o.status)}>{o.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="text-sm font-semibold mb-4">Low Stock</h3>
          <div className="space-y-3">
            {lowStockData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No low-stock items.</p>
            ) : (
              lowStockData.slice(0, 8).map((i: any) => (
                <div key={i.sku} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <div>
                      <p className="font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">{i.sku}</p>
                    </div>
                  </div>
                  <Badge className="bg-warning/10 text-warning border-0">{i.stock}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="text-sm font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {topProductsData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              topProductsData.slice(0, 8).map((p: any) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gold" />
                    <p className="font-medium">{p.name}</p>
                  </div>
                  <span className="text-muted-foreground">{p.revenue}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
