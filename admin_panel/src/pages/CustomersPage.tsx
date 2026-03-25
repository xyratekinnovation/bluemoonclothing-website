import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Eye, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiGet } from "@/lib/api";

interface Customer {
  id: string; name: string; email: string; phone: string;
  orders: number; totalSpend: number; joined: string; city: string;
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Customer | null>(null);
  const { data: customers = [] } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const result = await apiGet<any[]>("/customers");
      return result.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone ?? "-",
        orders: customer.orders ?? 0,
        totalSpend: Number(customer.total_spend ?? 0),
        joined: customer.joined ? String(customer.joined).slice(0, 10) : "-",
        city: "-",
      })) as Customer[];
    },
  });

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Customers</h2>
        <p className="text-sm text-muted-foreground">{customers.length} registered customers</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
      </div>

      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-4 font-medium text-muted-foreground">Customer</th>
                <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">City</th>
                <th className="p-4 font-medium text-muted-foreground hidden sm:table-cell">Orders</th>
                <th className="p-4 font-medium text-muted-foreground">Total Spend</th>
                <th className="p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-primary-foreground text-sm font-semibold">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{c.city}</td>
                  <td className="p-4 hidden sm:table-cell">{c.orders}</td>
                  <td className="p-4 font-medium">₹{c.totalSpend.toLocaleString()}</td>
                  <td className="p-4">
                    <Button variant="ghost" size="icon" onClick={() => setDetail(c)}><Eye className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{detail?.name}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{detail.email}</div>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{detail.phone}</p></div>
                <div><p className="text-muted-foreground">City</p><p className="font-medium">{detail.city}</p></div>
                <div><p className="text-muted-foreground">Total Orders</p><p className="font-medium">{detail.orders}</p></div>
                <div><p className="text-muted-foreground">Total Spend</p><p className="font-medium">₹{detail.totalSpend.toLocaleString()}</p></div>
                <div><p className="text-muted-foreground">Member Since</p><p className="font-medium">{detail.joined}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
