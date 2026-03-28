import { useEffect, useRef, useState } from "react";
import { Plus, Edit, Trash2, FolderTree, Upload, Loader2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPostFormData,
  resolveUploadedAssetUrl,
  type AdminCategory,
} from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  parent?: string;
  productCount: number;
  image?: string;
}

export default function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [imagePath, setImagePath] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
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

  const parents = categories.filter((c) => !c.parent);

  useEffect(() => {
    if (!dialogOpen) return;
    setImagePath(editCat?.image ?? "");
  }, [dialogOpen, editCat]);

  const handleDelete = async (id: string) => {
    await apiDelete(`/categories/${id}`);
    await queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    toast({ title: "Category deleted" });
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await apiPostFormData<{ url: string }>("/uploads/image", fd);
      setImagePath(url);
      toast({ title: "Image uploaded" });
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string).trim();
    const parentIdRaw = fd.get("parent_id") as string;
    const parent_id = parentIdRaw && parentIdRaw.length > 0 ? parentIdRaw : null;
    const slug = (fd.get("slug") as string)?.trim() || name.toLowerCase().replace(/\s+/g, "-");
    const image_url = imagePath.trim() || null;
    if (!name) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    try {
      if (editCat) {
        await mutateCategory.mutateAsync({
          id: editCat.id,
          payload: { name, slug, parent_id, image_url },
        });
        toast({ title: "Category updated" });
      } else {
        await createCategory.mutateAsync({
          name,
          slug,
          parent_id,
          image_url,
          is_active: true,
          sort_order: Number(fd.get("sort_order") || 0) || 0,
        });
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

  const previewUrl = resolveUploadedAssetUrl(imagePath);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categories</h2>
          <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        </div>
        <Button
          onClick={() => {
            setEditCat(null);
            setDialogOpen(true);
          }}
          className="gold-gradient text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="space-y-3">
        {parents.map((parent) => (
          <div key={parent.id} className="bg-card rounded-xl card-shadow">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                {parent.image ? (
                  <img
                    src={resolveUploadedAssetUrl(parent.image) ?? ""}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover bg-muted"
                  />
                ) : (
                  <FolderTree className="w-5 h-5 text-gold" />
                )}
                <div>
                  <p className="font-semibold">{parent.name}</p>
                  <p className="text-xs text-muted-foreground">{parent.productCount} products · Main category</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditCat(parent);
                    setDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(parent.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
            {categories
              .filter((c) => c.parent === parent.name)
              .map((child) => (
                <div
                  key={child.id}
                  className="flex items-center justify-between px-4 py-3 pl-12 border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {child.image ? (
                      <img
                        src={resolveUploadedAssetUrl(child.image) ?? ""}
                        alt=""
                        className="w-10 h-10 rounded-md object-cover bg-muted shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-muted shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{child.name}</p>
                      <p className="text-xs text-muted-foreground">/{child.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditCat(child);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(child.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditCat(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editCat ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input name="name" defaultValue={editCat?.name} required placeholder="e.g. Kurtas" />
            </div>
            <div>
              <Label>URL slug (optional)</Label>
              <Input name="slug" defaultValue={editCat?.slug} placeholder="Auto from name if empty" />
            </div>
            <div>
              <Label>Parent</Label>
              <select
                name="parent_id"
                defaultValue={editCat?.parentId ?? ""}
                className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm"
              >
                <option value="">None — top-level (e.g. Men, Women, Kids)</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Subcategories appear under &quot;Top categories&quot; on the storefront home. Assign Men, Women, or
                Kids as parent.
              </p>
            </div>
            {!editCat && (
              <div>
                <Label>Sort order</Label>
                <Input name="sort_order" type="number" defaultValue={0} className="bg-card" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Category image</Label>
              <p className="text-xs text-muted-foreground">
                Shown on the home category grids. Recommended ~4:3, at least 800px wide. Upload from your computer or
                paste a path after uploading elsewhere.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  ev.target.value = "";
                  if (f) void handleImageUpload(f);
                }}
              />
              {previewUrl ? (
                <div className="relative aspect-[4/3] max-h-40 rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => setImagePath("")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingImage}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload image
                </Button>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Image URL / path (optional)</Label>
                <Input
                  value={imagePath}
                  onChange={(e) => setImagePath(e.target.value)}
                  placeholder="/uploads/... or https://..."
                  className="bg-card font-mono text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gold-gradient text-primary-foreground">
                {editCat ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
