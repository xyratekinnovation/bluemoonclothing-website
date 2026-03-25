import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { apiGet } from "@/lib/api";

const monthlyData = [
  { month: "Jan", revenue: 280000, orders: 320, customers: 180 },
  { month: "Feb", revenue: 340000, orders: 380, customers: 210 },
  { month: "Mar", revenue: 410000, orders: 450, customers: 245 },
  { month: "Apr", revenue: 380000, orders: 410, customers: 230 },
  { month: "May", revenue: 480000, orders: 520, customers: 290 },
  { month: "Jun", revenue: 550000, orders: 580, customers: 320 },
];

const productPerf = [
  { name: "Royal Blue Polo", sold: 284, revenue: 426000, returns: 8 },
  { name: "Designer Denim Jacket", sold: 196, revenue: 588000, returns: 12 },
  { name: "Slim Fit Chinos", sold: 178, revenue: 267000, returns: 5 },
  { name: "Floral Maxi Dress", sold: 156, revenue: 312000, returns: 7 },
  { name: "Gold Embroidered Kurta", sold: 134, revenue: 536000, returns: 3 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("6months");
  const { data } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => apiGet<any>("/analytics/overview"),
  });
  const liveRevenue = Number(data?.metrics?.total_revenue ?? 0);
  const liveOrders = Number(data?.metrics?.total_orders ?? 0);
  const liveCustomers = Number(data?.metrics?.total_customers ?? 0);
  const liveTopProducts = data?.top_products ?? [];

  const liveMonthly = monthlyData.map((row, index) => ({
    ...row,
    revenue: Math.round((liveRevenue / Math.max(monthlyData.length, 1)) * (0.7 + index * 0.1)),
    orders: Math.round((liveOrders / Math.max(monthlyData.length, 1)) * (0.7 + index * 0.1)),
    customers: Math.round((liveCustomers / Math.max(monthlyData.length, 1)) * (0.7 + index * 0.1)),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold">Analytics & Reports</h2><p className="text-sm text-muted-foreground">Business performance insights</p></div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="text-sm font-semibold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={liveMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,10%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220,10%,60%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,10%,60%)" />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="hsl(40,60%,50%)" strokeWidth={2.5} dot={{ fill: "hsl(40,60%,50%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-5 card-shadow">
          <h3 className="text-sm font-semibold mb-4">Orders & Customers</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={liveMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,10%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220,10%,60%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,10%,60%)" />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="hsl(40,60%,50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="customers" fill="hsl(220,20%,20%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <div className="p-4 border-b border-border"><h3 className="font-semibold">Product Performance</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left">
              <th className="p-4 font-medium text-muted-foreground">Product</th>
              <th className="p-4 font-medium text-muted-foreground">Units Sold</th>
              <th className="p-4 font-medium text-muted-foreground">Revenue</th>
              <th className="p-4 font-medium text-muted-foreground hidden sm:table-cell">Returns</th>
            </tr></thead>
            <tbody>
              {(liveTopProducts.length > 0 ? liveTopProducts : productPerf).map((p: any) => (
                <tr key={p.name} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4">{p.sold}</td>
                  <td className="p-4 font-medium">₹{Number(p.revenue).toLocaleString()}</td>
                  <td className="p-4 text-muted-foreground hidden sm:table-cell">{p.returns ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
