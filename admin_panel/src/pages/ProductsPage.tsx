import { useEffect, useMemo, useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiDelete, apiGet, apiPatch, apiPost, type AdminCategory, type AdminProduct, type AdminProductRow } from "@/lib/api";

interface ProductRow {
  id: string;
  name: string;
  category: string;
  categoryId: string | null;
  description: string;
  imageUrl: string;
  price: number;
  discountPrice?: number;
  sku: string;
  stock: number;
  status: boolean;
  featured: boolean;
  sizes: string[];
  color: string;
}

type DraftVariant = {
  sku: string;
  size: string;
  color: string;
  price: number;
  stock_qty: number;
  is_active: boolean;
};

type DraftImage = {
  image_url: string;
  is_primary: boolean;
  sort_order: number;
};

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftCategoryId, setDraftCategoryId] = useState<string>("none");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftVariants, setDraftVariants] = useState<DraftVariant[]>([
    { sku: "", size: "M", color: "", price: 0, stock_qty: 0, is_active: true },
  ]);
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productsData = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => apiGet<AdminProductRow[]>("/products/admin-list?limit=100"),
    staleTime: 30_000,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => apiGet<AdminCategory[]>("/categories?active_only=false"),
    staleTime: 60_000,
  });

  const products = useMemo<ProductRow[]>(
    () =>
      productsData.map((product) => {
        const category = categories.find((item) => item.id === product.category_id);
        return {
          id: product.id,
          name: product.name,
          category: category?.name ?? "Uncategorized",
          categoryId: product.category_id,
          description: "",
          imageUrl: product.image_url ?? "",
          price: Number(product.price ?? 0),
          discountPrice: product.compare_at_price ? Number(product.compare_at_price) : undefined,
          sku: product.sku ?? "-",
          stock: product.stock_qty ?? 0,
          status: product.is_active,
          featured: product.is_featured,
          sizes: product.size ? [product.size] : [],
          color: product.color ?? "",
        };
      }),
    [categories, productsData],
  );

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiPatch<AdminProduct>(`/products/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });
  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => apiPost<AdminProduct>("/products", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const handleToggleStatus = (product: ProductRow) => {
    patchMutation.mutate({ id: product.id, payload: { is_active: !product.status } });
  };

  const handleToggleFeatured = (product: ProductRow) => {
    patchMutation.mutate({ id: product.id, payload: { is_featured: !product.featured } });
  };

  const openAdd = () => { setEditProduct(null); setDialogOpen(true); };
  const openEdit = async (p: ProductRow) => {
    try {
      const full = await apiGet<AdminProduct>(`/products/${p.id}`);
      setEditProduct(full);
      setDialogOpen(true);
    } catch (err) {
      toast({ title: "Unable to load product", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (!dialogOpen) return;
    if (!editProduct) {
      setDraftName("");
      setDraftCategoryId("none");
      setDraftDescription("");
      setDraftVariants([{ sku: "", size: "M", color: "", price: 0, stock_qty: 0, is_active: true }]);
      setDraftImages([]);
      return;
    }
    setDraftName(editProduct.name);
    setDraftCategoryId(editProduct.category_id ?? "none");
    setDraftDescription(editProduct.description ?? "");
    setDraftVariants(
      (editProduct.variants?.length ? editProduct.variants : []).map((v) => ({
        sku: v.sku ?? "",
        size: v.size ?? "",
        color: v.color ?? "",
        price: Number(v.price ?? 0),
        stock_qty: Number(v.stock_qty ?? 0),
        is_active: Boolean(v.is_active),
      })) || [{ sku: "", size: "M", color: "", price: 0, stock_qty: 0, is_active: true }],
    );
    const imgs = (editProduct.images ?? []).map((img) => ({
      image_url: img.image_url,
      is_primary: img.is_primary,
      sort_order: img.sort_order,
    }));
    setDraftImages(imgs);
  }, [dialogOpen, editProduct]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = draftName.trim();
    if (!name) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    const categoryId = draftCategoryId && draftCategoryId !== "none" ? draftCategoryId : null;
    const description = draftDescription?.trim() ? draftDescription.trim() : null;
    const slug = name.toLowerCase().trim().replace(/\s+/g, "-");

    const variants = draftVariants
      .map((v) => ({
        sku: v.sku.trim(),
        size: v.size?.trim() || null,
        color: v.color?.trim() || null,
        price: Number(v.price || 0),
        stock_qty: Number(v.stock_qty || 0),
        is_active: Boolean(v.is_active),
      }))
      .filter((v) => Boolean(v.sku));

    if (variants.length === 0) {
      toast({ title: "Add at least 1 variant with SKU", variant: "destructive" });
      return;
    }

    const images = draftImages
      .map((img, idx) => ({
        image_url: img.image_url.trim(),
        is_primary: Boolean(img.is_primary),
        sort_order: Number.isFinite(img.sort_order) ? img.sort_order : idx,
      }))
      .filter((img) => Boolean(img.image_url));

    // Ensure max one primary image
    const primaries = images.filter((i) => i.is_primary);
    if (primaries.length > 1) {
      toast({ title: "Only one primary image allowed", variant: "destructive" });
      return;
    }

    try {
      if (editProduct) {
        await patchMutation.mutateAsync({
          id: editProduct.id,
          payload: {
            name,
            category_id: categoryId,
            slug,
            description,
            variants,
            images,
          },
        });
        toast({ title: "Product updated" });
      } else {
        await createMutation.mutateAsync({
          name,
          slug,
          category_id: categoryId,
          description,
          is_active: true,
          is_featured: false,
          variants,
          images,
        });
        toast({ title: "Product added" });
      }
      setDialogOpen(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-sm text-muted-foreground">{products.length} total products</p>
        </div>
        <Button onClick={openAdd} className="gold-gradient text-primary-foreground hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Array.from(new Set(products.map((item) => item.category))).map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-4 font-medium text-muted-foreground">Product</th>
                <th className="p-4 font-medium text-muted-foreground hidden md:table-cell">SKU</th>
                <th className="p-4 font-medium text-muted-foreground">Price</th>
                <th className="p-4 font-medium text-muted-foreground hidden sm:table-cell">Stock</th>
                <th className="p-4 font-medium text-muted-foreground hidden lg:table-cell">Active</th>
                <th className="p-4 font-medium text-muted-foreground hidden lg:table-cell">Featured</th>
                <th className="p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category} · {p.sizes.join(", ")}</p>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell text-muted-foreground">{p.sku}</td>
                  <td className="p-4">
                    {p.discountPrice ? (
                      <div>
                        <span className="font-medium">₹{p.discountPrice.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground line-through ml-1">₹{p.price.toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="font-medium">₹{p.price.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <Badge className={`border-0 ${p.stock <= 5 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                      {p.stock}
                    </Badge>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <Switch checked={p.status} onCheckedChange={() => handleToggleStatus(p)} />
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <Switch checked={p.featured} onCheckedChange={() => handleToggleFeatured(p)} />
                  </td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(p)}><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> View</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Name</Label>
                <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} required />
              </div>
              <div>
                <Label>Category</Label>
                <select value={draftCategoryId} onChange={(e) => setDraftCategoryId(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card">
                  <option value="none">Uncategorized</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Input value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} placeholder="Product description" />
              </div>
            </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Variants (Size/Color/SKU)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDraftVariants((prev) => [...prev, { sku: "", size: "M", color: "", price: 0, stock_qty: 0, is_active: true }])}
                  >
                    Add Variant
                  </Button>
                </div>
                <div className="space-y-3">
                  {draftVariants.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
                      <div className="col-span-2">
                        <Label className="text-xs">SKU</Label>
                        <Input
                          value={v.sku}
                          onChange={(e) => setDraftVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, sku: e.target.value } : x)))}
                          placeholder="SKU"
                          required={idx === 0}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Size</Label>
                        <Input value={v.size} onChange={(e) => setDraftVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, size: e.target.value } : x)))} />
                      </div>
                      <div>
                        <Label className="text-xs">Color</Label>
                        <Input value={v.color} onChange={(e) => setDraftVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, color: e.target.value } : x)))} />
                      </div>
                      <div>
                        <Label className="text-xs">Price (₹)</Label>
                        <Input
                          type="number"
                          value={v.price}
                          onChange={(e) => setDraftVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, price: Number(e.target.value) } : x)))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Stock</Label>
                        <Input
                          type="number"
                          value={v.stock_qty}
                          onChange={(e) => setDraftVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, stock_qty: Number(e.target.value) } : x)))}
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={v.is_active}
                            onCheckedChange={(checked) => setDraftVariants((prev) => prev.map((x, i) => (i === idx ? { ...x, is_active: checked } : x)))}
                          />
                          <span className="text-xs text-muted-foreground">Active</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDraftVariants((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Images</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDraftImages((prev) => [...prev, { image_url: "", is_primary: prev.length === 0, sort_order: prev.length }])}
                  >
                    Add Image
                  </Button>
                </div>
                <div className="space-y-3">
                  {draftImages.map((img, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
                      <div className="col-span-2">
                        <Label className="text-xs">Image URL</Label>
                        <Input
                          value={img.image_url}
                          onChange={(e) => setDraftImages((prev) => prev.map((x, i) => (i === idx ? { ...x, image_url: e.target.value } : x)))}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={img.is_primary}
                          onCheckedChange={(checked) =>
                            setDraftImages((prev) =>
                              prev.map((x, i) => ({ ...x, is_primary: i === idx ? checked : false })),
                            )
                          }
                        />
                        <span className="text-xs text-muted-foreground">Primary</span>
                      </div>
                      <div>
                        <Label className="text-xs">Sort order</Label>
                        <Input
                          type="number"
                          value={img.sort_order}
                          onChange={(e) => setDraftImages((prev) => prev.map((x, i) => (i === idx ? { ...x, sort_order: Number(e.target.value) } : x)))}
                        />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDraftImages((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  {draftImages.length === 0 && <p className="text-sm text-muted-foreground">No images added.</p>}
                </div>
              </div>
            </div>
            <DialogFooter className="pt-3 mt-3 border-t border-border bg-card">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="gold-gradient text-primary-foreground">{editProduct ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
