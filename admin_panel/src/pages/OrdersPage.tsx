import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Eye, MoreHorizontal, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPatch } from "@/lib/api";

interface Order {
  orderId: string;
  id: string; customer: string; email: string; items: string[];
  total: number; status: string; date: string; address: string;
  payment: string; trackingId?: string; paymentRef?: string;
}

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

const statuses = ["All", "Pending", "Paid", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  const [detail, setDetail] = useState<Order | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const result = await apiGet<any[]>("/orders/admin");
      return result.map((order) => ({
        orderId: order.id,
        id: order.order_number,
        customer: order.customer_name ?? "Customer",
        email: order.customer_email ?? "-",
        items: order.items.map((item: any) => `${item.product_name_snapshot} x${item.quantity}`),
        total: Number(order.grand_total),
        status: `${order.status}`.charAt(0).toUpperCase() + `${order.status}`.slice(1),
        date: new Date(order.created_at ?? Date.now()).toISOString().slice(0, 10),
        address: "-",
        payment: `${order.latest_payment_status ?? order.payment_status}`.charAt(0).toUpperCase() + `${order.latest_payment_status ?? order.payment_status}`.slice(1),
        paymentRef: order.latest_payment_ref ?? undefined,
      })) as Order[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderNumber, status }: { orderNumber: string; status: string }) => {
      const order = orders.find((item) => item.id === orderNumber);
      if (!order) throw new Error("Order not found");
      return apiPatch(`/orders/${order.orderId}/status`, { status: status.toLowerCase() });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const filtered = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "All" || o.status === tab;
    return matchSearch && matchTab;
  });

  const updateStatus = (id: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderNumber: id, status: newStatus });
    toast({ title: `Order #${id} updated to ${newStatus}` });
    if (detail?.id === id) setDetail({ ...detail, status: newStatus });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Orders</h2>
        <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted">
          {statuses.map(s => (
            <TabsTrigger key={s} value={s} className="text-xs">{s}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
      </div>

      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-4 font-medium text-muted-foreground">Order</th>
                <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">Customer</th>
                <th className="p-4 font-medium text-muted-foreground">Total</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
                <th className="p-4 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                <th className="p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                  <td className="p-4 font-medium">#{o.id}</td>
                  <td className="p-4 hidden md:table-cell">{o.customer}</td>
                  <td className="p-4 font-medium">₹{o.total.toLocaleString()}</td>
                  <td className="p-4"><Badge className={statusColor(o.status)}>{o.status}</Badge></td>
                  <td className="p-4 text-muted-foreground hidden sm:table-cell">{o.date}</td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetail(o)}><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus(o.id, "Shipped")}><Truck className="w-4 h-4 mr-2" /> Mark Shipped</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Order #{detail?.id}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{detail.customer}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{detail.email}</p></div>
                <div><p className="text-muted-foreground">Address</p><p className="font-medium">{detail.address}</p></div>
                <div><p className="text-muted-foreground">Payment</p><p className="font-medium">{detail.payment}</p></div>
                <div><p className="text-muted-foreground">Payment Ref</p><p className="font-medium">{detail.paymentRef ?? "-"}</p></div>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Items</p>
                {detail.items.map((item, i) => <p key={i} className="font-medium">{item}</p>)}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-bold">₹{detail.total.toLocaleString()}</span>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Update Status</p>
                <Select value={detail.status} onValueChange={v => updateStatus(detail.id, v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.filter(s => s !== "All").map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
