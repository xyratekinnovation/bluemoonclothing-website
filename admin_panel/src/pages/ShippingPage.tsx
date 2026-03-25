import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

interface Zone { id: string; name: string; charge: number; est: string; active: boolean; }

export default function ShippingPage() {
  const queryClient = useQueryClient();
  const { data: zones = [] } = useQuery({
    queryKey: ["admin-shipping"],
    queryFn: async () => {
      const result = await apiGet<any[]>("/shipping-zones");
      return result.map((item) => ({
        id: item.id,
        name: item.name,
        charge: Number(item.charge),
        est: item.eta_text,
        active: item.is_active,
      })) as Zone[];
    },
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState<Zone | null>(null);
  const { toast } = useToast();
  const createMutation = useMutation({
    mutationFn: (payload: any) => apiPost("/shipping-zones", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-shipping"] }),
  });
  const patchMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => apiPatch(`/shipping-zones/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-shipping"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/shipping-zones/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-shipping"] }),
  });

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const charge = Number(fd.get("charge"));
    const est = fd.get("est") as string;
    if (edit) {
      await patchMutation.mutateAsync({ id: edit.id, payload: { name, charge, eta_text: est } });
      toast({ title: "Zone updated" });
    } else {
      await createMutation.mutateAsync({ name, charge, eta_text: est, is_active: true });
      toast({ title: "Zone added" });
    }
    setDialogOpen(false); setEdit(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Shipping & Delivery</h2><p className="text-sm text-muted-foreground">Manage delivery zones and charges</p></div>
        <Button onClick={() => { setEdit(null); setDialogOpen(true); }} className="gold-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Add Zone</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {zones.map(z => (
          <div key={z.id} className="bg-card rounded-xl p-5 card-shadow hover:card-shadow-hover transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold-light flex items-center justify-center"><Truck className="w-5 h-5 text-gold" /></div>
                <div>
                  <p className="font-semibold">{z.name}</p>
                  <p className="text-xs text-muted-foreground">{z.est}</p>
                </div>
              </div>
              <Switch checked={z.active} onCheckedChange={() => patchMutation.mutate({ id: z.id, payload: { is_active: !z.active } })} />
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-lg font-bold">{z.charge === 0 ? "Free" : `₹${z.charge}`}</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEdit(z); setDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => { deleteMutation.mutate(z.id); toast({ title: "Zone deleted" }); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setEdit(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{edit ? "Edit Zone" : "Add Zone"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div><Label>Zone Name</Label><Input name="name" defaultValue={edit?.name} required /></div>
            <div><Label>Shipping Charge (₹)</Label><Input name="charge" type="number" defaultValue={edit?.charge} required /></div>
            <div><Label>Estimated Delivery</Label><Input name="est" defaultValue={edit?.est} placeholder="e.g. 2-3 days" required /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gold-gradient text-primary-foreground">{edit ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
