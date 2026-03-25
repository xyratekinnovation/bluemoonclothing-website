import {
  DollarSign, ShoppingCart, Users, TrendingUp, CreditCard,
  Package, AlertTriangle, Star,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import MetricCard from "@/components/dashboard/MetricCard";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { apiGet } from "@/lib/api";

const salesData = [
  { name: "Mon", sales: 4200 }, { name: "Tue", sales: 5800 },
  { name: "Wed", sales: 4900 }, { name: "Thu", sales: 7200 },
  { name: "Fri", sales: 6800 }, { name: "Sat", sales: 9200 },
  { name: "Sun", sales: 8100 },
];

const ordersRevenueData = [
  { name: "Jan", orders: 320, revenue: 28000 },
  { name: "Feb", orders: 380, revenue: 34000 },
  { name: "Mar", orders: 450, revenue: 41000 },
  { name: "Apr", orders: 410, revenue: 38000 },
  { name: "May", orders: 520, revenue: 48000 },
  { name: "Jun", orders: 580, revenue: 55000 },
];

const categoryData = [
  { name: "Men", value: 42 },
  { name: "Women", value: 38 },
  { name: "Kids", value: 12 },
  { name: "Accessories", value: 8 },
];
const PIE_COLORS = ["hsl(40,60%,50%)", "hsl(220,20%,20%)", "hsl(40,50%,70%)", "hsl(220,10%,60%)"];

const recentOrders = [
  { id: "#BM-1024", customer: "Arjun Mehta", total: "₹4,299", status: "Delivered", date: "Today" },
  { id: "#BM-1023", customer: "Priya Sharma", total: "₹2,149", status: "Shipped", date: "Today" },
  { id: "#BM-1022", customer: "Rahul Verma", total: "₹6,799", status: "Paid", date: "Yesterday" },
  { id: "#BM-1021", customer: "Sneha Patel", total: "₹1,599", status: "Pending", date: "Yesterday" },
  { id: "#BM-1020", customer: "Vikram Singh", total: "₹3,449", status: "Delivered", date: "2 days ago" },
];

const lowStockItems = [
  { name: "Classic Navy Blazer", stock: 3, sku: "BM-BLZ-001" },
  { name: "Gold Embroidered Kurta", stock: 2, sku: "BM-KRT-045" },
  { name: "Premium White Shirt", stock: 5, sku: "BM-SHT-012" },
];

const topProducts = [
  { name: "Royal Blue Polo", sales: 284, revenue: "₹4,26,000" },
  { name: "Designer Denim Jacket", sales: 196, revenue: "₹5,88,000" },
  { name: "Slim Fit Chinos", sales: 178, revenue: "₹2,67,000" },
];

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
  });
  const metrics = data?.metrics;
  const recentOrdersData = data?.recent_orders ?? recentOrders;
  const lowStockData = data?.low_stock ?? lowStockItems;
  const topProductsData = data?.top_products ?? topProducts;

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
        <MetricCard title="Conversion Rate" value="3.24%" change="-0.8% from last month" changeType="negative" icon={<TrendingUp className="w-5 h-5" />} />
        <MetricCard title="Avg. Order Value" value={`₹${Number(metrics?.avg_order_value ?? 0).toLocaleString()}`} change="Live data" changeType="positive" icon={<CreditCard className="w-5 h-5" />} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Trend */}
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="text-sm font-semibold mb-4">Sales Trend (This Week)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,10%,90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220,10%,60%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,10%,60%)" />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="hsl(40,60%,50%)" strokeWidth={2.5} dot={{ fill: "hsl(40,60%,50%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders vs Revenue */}
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="text-sm font-semibold mb-4">Orders vs Revenue</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ordersRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,10%,90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220,10%,60%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,10%,60%)" />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="hsl(40,60%,50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill="hsl(220,20%,20%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie + Widgets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category Sales */}
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="text-sm font-semibold mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Orders */}
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="text-sm font-semibold mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {recentOrdersData.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{o.id.startsWith("#") ? o.id : `#${o.id}`}</p>
                  <p className="text-xs text-muted-foreground">{o.customer ?? "Customer"}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="font-medium">{typeof o.total === "number" ? `₹${o.total.toLocaleString()}` : o.total}</span>
                  <Badge className={`text-[10px] ${statusColor(o.status)}`}>{o.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock + Top Products */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl p-5 card-shadow">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h3 className="text-sm font-semibold">Low Stock Alerts</h3>
            </div>
            <div className="space-y-2">
              {lowStockData.map((item: any) => (
                <div key={item.sku} className="flex justify-between text-sm">
                  <span className="truncate pr-2">{item.name ?? item.sku}</span>
                  <span className="text-destructive font-medium whitespace-nowrap">{item.stock} left</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 card-shadow">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-gold" />
              <h3 className="text-sm font-semibold">Top Selling</h3>
            </div>
            <div className="space-y-2">
              {topProductsData.map((p: any) => (
                <div key={p.name} className="flex justify-between text-sm">
                  <span className="truncate pr-2">{p.name}</span>
                  <span className="text-muted-foreground whitespace-nowrap">{p.sales ?? p.sold} sold</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
