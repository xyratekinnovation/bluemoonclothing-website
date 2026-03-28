import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Image, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

interface Banner { id: string; title: string; subtitle: string; section: string; active: boolean; }

export default function BannersPage() {
  const queryClient = useQueryClient();
  const { data: banners = [] } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const result = await apiGet<any[]>("/banners");
      return result.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle ?? "",
        section: item.section,
        active: item.is_active,
      })) as Banner[];
    },
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const createMutation = useMutation({
    mutationFn: (payload: any) => apiPost("/banners", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-banners"] }),
  });
  const patchMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => apiPatch(`/banners/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-banners"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast({ title: "Banner deleted" });
    },
    onError: (e: Error) =>
      toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await createMutation.mutateAsync({
      title: fd.get("title") as string,
      subtitle: fd.get("subtitle") as string,
      section: fd.get("section") as string,
      is_active: true,
    });
    toast({ title: "Banner added" });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Banners & Homepage</h2><p className="text-sm text-muted-foreground">Control your storefront appearance</p></div>
        <Button onClick={() => setDialogOpen(true)} className="gold-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Add Banner</Button>
      </div>

      <div className="space-y-3">
        {banners.map(b => (
          <div key={b.id} className="bg-card rounded-xl p-4 card-shadow flex items-center gap-4 hover:card-shadow-hover transition-shadow">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab flex-shrink-0" />
            <div className="w-16 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><Image className="w-5 h-5 text-muted-foreground" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{b.title}</p>
              <p className="text-xs text-muted-foreground">{b.subtitle}</p>
              <p className="text-xs text-gold mt-0.5">{b.section}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch checked={b.active} onCheckedChange={() => patchMutation.mutate({ id: b.id, payload: { is_active: !b.active } })} />
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(b.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Banner</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div><Label>Title</Label><Input name="title" required /></div>
            <div><Label>Subtitle</Label><Input name="subtitle" /></div>
            <div><Label>Section</Label>
              <select name="section" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option>Hero</option>
                <option>Featured</option>
                <option>Category Highlight</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gold-gradient text-primary-foreground">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
