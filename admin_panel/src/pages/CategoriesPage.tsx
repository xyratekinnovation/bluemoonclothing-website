import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Edit, Trash2, FolderTree, Upload, Loader2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

function sortCats(list: AdminCategory[]): AdminCategory[] {
  return [...list].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

function childrenOf(parentId: string | null, all: AdminCategory[]): AdminCategory[] {
  return sortCats(all.filter((c) => c.parent_id === parentId));
}

function collectDescendantIds(rootId: string, all: AdminCategory[]): Set<string> {
  const out = new Set<string>();
  const walk = (id: string) => {
    for (const c of all) {
      if (c.parent_id === id) {
        out.add(c.id);
        walk(c.id);
      }
    }
  };
  walk(rootId);
  return out;
}

type ParentOption = { id: string; label: string; depth: number };

function flatParentOptions(
  all: AdminCategory[],
  excludeIds: Set<string>,
  parentId: string | null = null,
  depth = 0,
): ParentOption[] {
  const kids = sortCats(all.filter((c) => c.parent_id === parentId && !excludeIds.has(c.id)));
  const out: ParentOption[] = [];
  for (const c of kids) {
    out.push({ id: c.id, label: c.name, depth });
    out.push(...flatParentOptions(all, excludeIds, c.id, depth + 1));
  }
  return out;
}

function categoryHasChildren(id: string, all: AdminCategory[]) {
  return all.some((c) => c.parent_id === id);
}

function CategoryTreeRow({
  cat,
  depth,
  categoriesData,
  onPatch,
  onEdit,
  onDelete,
}: {
  cat: AdminCategory;
  depth: number;
  categoriesData: AdminCategory[];
  onPatch: (id: string, payload: Record<string, unknown>) => void;
  onEdit: (c: AdminCategory) => void;
  onDelete: (id: string) => void;
}) {
  const kids = childrenOf(cat.id, categoriesData);
  const leaf = !categoryHasChildren(cat.id, categoriesData);

  return (
    <>
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 border-b border-border hover:bg-surface-hover transition-colors"
        style={{ paddingLeft: `${12 + depth * 18}px` }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 basis-[200px]">
          {cat.image_url ? (
            <img
              src={resolveUploadedAssetUrl(cat.image_url) ?? ""}
              alt=""
              className="w-10 h-10 rounded-md object-cover bg-muted shrink-0"
            />
          ) : (
            <FolderTree className="w-5 h-5 text-gold shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{cat.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              /{cat.slug}
              {!cat.is_active ? " · inactive" : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">Active</span>
            <Switch checked={cat.is_active} onCheckedChange={(v) => onPatch(cat.id, { is_active: v })} />
          </div>
          {leaf ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                Home row
              </span>
              <Switch
                checked={cat.show_on_home}
                onCheckedChange={(v) => onPatch(cat.id, { show_on_home: v })}
                disabled={!cat.is_active}
              />
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground max-w-[140px]">
              Home row applies to leaf subcategories
            </span>
          )}
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(cat)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(cat.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
      {kids.map((ch) => (
        <CategoryTreeRow
          key={ch.id}
          cat={ch}
          depth={depth + 1}
          categoriesData={categoriesData}
          onPatch={onPatch}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

export default function CategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<AdminCategory | null>(null);
  const [formActive, setFormActive] = useState(true);
  const [formHome, setFormHome] = useState(true);
  const [imagePath, setImagePath] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categoriesData = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => apiGet<AdminCategory[]>("/categories?active_only=false"),
  });

  const mutateCategory = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiPatch<AdminCategory>(`/categories/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
  });
  const createCategory = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiPost<AdminCategory>("/categories", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  const parentOptions = useMemo(() => {
    const exclude = new Set<string>();
    if (editCat) {
      exclude.add(editCat.id);
      for (const id of collectDescendantIds(editCat.id, categoriesData)) exclude.add(id);
    }
    return flatParentOptions(categoriesData, exclude);
  }, [categoriesData, editCat]);

  useEffect(() => {
    if (!dialogOpen) return;
    setImagePath(editCat?.image_url ?? "");
    if (editCat) {
      setFormActive(editCat.is_active);
      setFormHome(editCat.show_on_home);
    } else {
      setFormActive(true);
      setFormHome(true);
    }
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
          payload: { name, slug, parent_id, image_url, is_active: formActive, show_on_home: formHome },
        });
        toast({ title: "Category updated" });
      } else {
        await createCategory.mutateAsync({
          name,
          slug,
          parent_id,
          image_url,
          is_active: formActive,
          show_on_home: formHome,
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

  const patchCategory = (id: string, payload: Record<string, unknown>) =>
    mutateCategory.mutate({ id, payload });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categories</h2>
          <p className="text-sm text-muted-foreground">{categoriesData.length} categories</p>
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

      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            <strong>Active</strong> hides the category from the storefront. <strong>Home row</strong> only affects leaf
            categories in the home “Top categories” strip — turn off to reduce clutter without deactivating.
          </p>
        </div>
        {childrenOf(null, categoriesData).map((root) => (
          <CategoryTreeRow
            key={root.id}
            cat={root}
            depth={0}
            categoriesData={categoriesData}
            onPatch={patchCategory}
            onEdit={(c) => {
              setEditCat(c);
              setDialogOpen(true);
            }}
            onDelete={handleDelete}
          />
        ))}
        {categoriesData.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No categories yet.</p>
        ) : null}
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
          <form key={editCat?.id ?? "new"} onSubmit={handleSave} className="space-y-4">
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
                defaultValue={editCat?.parent_id ?? ""}
                className="w-full h-10 rounded-md border border-border bg-card px-3 text-sm"
              >
                <option value="">None — top-level (e.g. Men, Women, Kids)</option>
                {parentOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {"\u00A0".repeat(o.depth * 2)}
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Nested subcategories are supported. Leaf categories can appear in the home “Top categories” row when
                &quot;Home row&quot; is on.
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm">Active on storefront</Label>
                <p className="text-xs text-muted-foreground">Off hides category and its products from shoppers.</p>
              </div>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm">Show on home “Top categories”</Label>
                <p className="text-xs text-muted-foreground">Only applies to leaf categories; safe to leave on for groups.</p>
              </div>
              <Switch checked={formHome} onCheckedChange={setFormHome} disabled={!formActive} />
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
