import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Tag, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

interface Coupon { id: string; code: string; type: "percent" | "flat"; value: number; minOrder: number; usageLimit: number; used: number; expiry: string; active: boolean; }

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const { data: coupons = [] } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const result = await apiGet<any[]>("/coupons");
      return result.map((item) => ({
        id: item.id,
        code: item.code,
        type: item.discount_type,
        value: Number(item.value),
        minOrder: Number(item.min_order_amount),
        usageLimit: item.usage_limit ?? 0,
        used: item.used_count,
        expiry: item.expires_at ? new Date(item.expires_at).toISOString().slice(0, 10) : "",
        active: item.is_active,
      })) as Coupon[];
    },
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState<Coupon | null>(null);
  const { toast } = useToast();
  const createMutation = useMutation({
    mutationFn: (payload: any) => apiPost("/coupons", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });
  const patchMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => apiPatch(`/coupons/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "Coupon deleted" });
    },
    onError: (e: Error) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const code = (fd.get("code") as string).toUpperCase();
    const type = fd.get("type") as "percent" | "flat";
    const value = Number(fd.get("value"));
    const minOrder = Number(fd.get("minOrder"));
    const usageLimit = Number(fd.get("usageLimit"));
    const expiry = fd.get("expiry") as string;
    if (edit) {
      await patchMutation.mutateAsync({
        id: edit.id,
        payload: { code, discount_type: type, value, min_order_amount: minOrder, usage_limit: usageLimit, expires_at: expiry },
      });
      toast({ title: "Coupon updated" });
    } else {
      await createMutation.mutateAsync({
        code, discount_type: type, value, min_order_amount: minOrder, usage_limit: usageLimit, used_count: 0, expires_at: expiry, is_active: true,
      });
      toast({ title: "Coupon created" });
    }
    setDialogOpen(false); setEdit(null);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: code });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Coupons & Offers</h2><p className="text-sm text-muted-foreground">{coupons.length} coupons</p></div>
        <Button onClick={() => { setEdit(null); setDialogOpen(true); }} className="gold-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Create Coupon</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map(c => (
          <div key={c.id} className="bg-card rounded-xl p-5 card-shadow hover:card-shadow-hover transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gold" />
                <code className="font-bold text-lg">{c.code}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(c.code)}><Copy className="w-3 h-3" /></Button>
              </div>
              <Switch checked={c.active} onCheckedChange={() => patchMutation.mutate({ id: c.id, payload: { is_active: !c.active } })} />
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-medium text-gold">{c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`}</p>
              {c.minOrder > 0 && <p className="text-muted-foreground">Min. order: ₹{c.minOrder}</p>}
              <p className="text-muted-foreground">{c.used}/{c.usageLimit} used</p>
              <p className="text-muted-foreground">Expires: {c.expiry}</p>
            </div>
            <div className="flex gap-1 mt-3">
              <Button variant="ghost" size="sm" onClick={() => { setEdit(c); setDialogOpen(true); }}><Edit className="w-3.5 h-3.5 mr-1" /> Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="w-3.5 h-3.5 mr-1 text-destructive" /> Delete</Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setEdit(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{edit ? "Edit Coupon" : "Create Coupon"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div><Label>Code</Label><Input name="code" defaultValue={edit?.code} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Type</Label>
                <select name="type" defaultValue={edit?.type || "percent"} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="percent">Percentage</option>
                  <option value="flat">Flat Amount</option>
                </select>
              </div>
              <div><Label>Value</Label><Input name="value" type="number" defaultValue={edit?.value} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Min Order (₹)</Label><Input name="minOrder" type="number" defaultValue={edit?.minOrder} /></div>
              <div><Label>Usage Limit</Label><Input name="usageLimit" type="number" defaultValue={edit?.usageLimit} required /></div>
            </div>
            <div><Label>Expiry Date</Label><Input name="expiry" type="date" defaultValue={edit?.expiry} required /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gold-gradient text-primary-foreground">{edit ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
