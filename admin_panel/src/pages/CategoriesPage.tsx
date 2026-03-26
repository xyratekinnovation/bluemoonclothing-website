import { useState } from "react";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiDelete, apiGet, apiPatch, apiPost, type AdminCategory } from "@/lib/api";

interface Category {
  id: string; name: string; slug: string; parentId?: string; parent?: string; productCount: number; image?: string;
}

export default function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categoriesData = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => apiGet<AdminCategory[]>("/categories?active_only=false"),
  });
  const categories: Category[] = categoriesData.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parent_id ?? undefined,
    parent: categoriesData.find((item) => item.id === category.parent_id)?.name,
    productCount: 0,
    image: category.image_url ?? undefined,
  }));
  const mutateCategory = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiPatch<AdminCategory>(`/categories/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
  });
  const createCategory = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiPost<AdminCategory>("/categories", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  const parents = categories.filter(c => !c.parent);

  const handleDelete = async (id: string) => {
    await apiDelete(`/categories/${id}`);
    await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    toast({ title: "Category deleted" });
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const parentName = fd.get("parent") as string;
    const parent = categories.find((category) => category.name.toLowerCase() === parentName.toLowerCase());
    const slug = name.toLowerCase().trim().replace(/\s+/g, "-");
    try {
      if (editCat) {
        await mutateCategory.mutateAsync({
          id: editCat.id,
          payload: { name, slug, parent_id: parent?.id ?? null },
        });
        toast({ title: "Category updated" });
      } else {
        await createCategory.mutateAsync({ name, slug, parent_id: parent?.id ?? null, is_active: true, sort_order: 0 });
        toast({ title: "Category added" });
      }
      setDialogOpen(false);
      setEditCat(null);
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categories</h2>
          <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        </div>
        <Button onClick={() => { setEditCat(null); setDialogOpen(true); }} className="gold-gradient text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="space-y-3">
        {parents.map(parent => (
          <div key={parent.id} className="bg-card rounded-xl card-shadow">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <FolderTree className="w-5 h-5 text-gold" />
                <div>
                  <p className="font-semibold">{parent.name}</p>
                  <p className="text-xs text-muted-foreground">{parent.productCount} products</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setEditCat(parent); setDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(parent.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </div>
            {categories.filter(c => c.parent === parent.name).map(child => (
              <div key={child.id} className="flex items-center justify-between px-4 py-3 pl-12 border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                <div>
                  <p className="text-sm font-medium">{child.name}</p>
                  <p className="text-xs text-muted-foreground">{child.productCount} products</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditCat(child); setDialogOpen(true); }}><Edit className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(child.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setEditCat(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editCat ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div><Label>Name</Label><Input name="name" defaultValue={editCat?.name} required /></div>
            <div><Label>Parent (optional)</Label><Input name="parent" defaultValue={editCat?.parent} placeholder="e.g. Men, Women, Kids" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gold-gradient text-primary-foreground">{editCat ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
