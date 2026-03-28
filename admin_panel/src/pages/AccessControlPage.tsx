import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

interface Admin { id: string; name: string; email: string; role: string; permissions: string[]; active: boolean; }

const allPerms = ["Products", "Orders", "Analytics", "Customers", "Payments", "Settings", "Access Control"];

export default function AccessControlPage() {
  const queryClient = useQueryClient();
  const { data: admins = [] } = useQuery({
    queryKey: ["admin-access-control"],
    queryFn: () => apiGet<Admin[]>("/access-control/admins"),
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [edit, setEdit] = useState<Admin | null>(null);
  const [perms, setPerms] = useState<string[]>([]);
  const { toast } = useToast();
  const createMutation = useMutation({
    mutationFn: (payload: any) => apiPost("/access-control/admins", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-access-control"] }),
  });
  const patchMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => apiPatch(`/access-control/admins/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-access-control"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/access-control/admins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-access-control"] });
      toast({ title: "Admin removed" });
    },
    onError: (e: Error) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const openAdd = () => { setEdit(null); setPerms([]); setDialogOpen(true); };
  const openEdit = (a: Admin) => { setEdit(a); setPerms(a.permissions); setDialogOpen(true); };

  const togglePerm = (p: string) => setPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const email = fd.get("email") as string;
    const role = fd.get("role") as string;
    if (edit) {
      await patchMutation.mutateAsync({ id: edit.id, payload: { name, email, role, permissions: perms } });
      toast({ title: "Admin updated" });
    } else {
      await createMutation.mutateAsync({ name, email, role, permissions: perms, active: true });
      toast({ title: "Admin added" });
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Access Control</h2><p className="text-sm text-muted-foreground">Manage admin roles and permissions</p></div>
        <Button onClick={openAdd} className="gold-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Add Admin</Button>
      </div>

      <div className="space-y-3">
        {admins.map(a => (
          <div key={a.id} className="bg-card rounded-xl p-5 card-shadow flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-primary-foreground font-semibold">{a.name.charAt(0)}</div>
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">{a.email}</p>
              </div>
            </div>
            <Badge className="bg-gold-light text-gold-dark border-0 w-fit">{a.role}</Badge>
            <div className="flex flex-wrap gap-1">
              {a.permissions.map(p => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch checked={a.active} onCheckedChange={() => patchMutation.mutate({ id: a.id, payload: { active: !a.active, role: a.role, permissions: a.permissions } })} />
              <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setEdit(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{edit ? "Edit Admin" : "Add Admin"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div><Label>Name</Label><Input name="name" defaultValue={edit?.name} required /></div>
            <div><Label>Email</Label><Input name="email" type="email" defaultValue={edit?.email} required /></div>
            <div><Label>Role</Label>
              <select name="role" defaultValue={edit?.role || "Staff"} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option>Super Admin</option>
                <option>Staff</option>
              </select>
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {allPerms.map(p => (
                  <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={perms.includes(p)} onCheckedChange={() => togglePerm(p)} />
                    {p}
                  </label>
                ))}
              </div>
            </div>
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
