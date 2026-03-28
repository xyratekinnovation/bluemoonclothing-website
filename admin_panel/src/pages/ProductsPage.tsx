import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiDelete, apiGet, apiPatch, apiPost, type AdminCategory, type AdminProduct, type AdminProductRow } from "@/lib/api";

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const MATRIX_KEY_SEP = "\x1e";

function encodeMatrixKey(size: string, color: string | null): string {
  return `${size}${MATRIX_KEY_SEP}${color ?? ""}`;
}

function parseMatrixKey(key: string): { size: string; color: string | null } {
  const i = key.indexOf(MATRIX_KEY_SEP);
  if (i < 0) return { size: key, color: null };
  const colorPart = key.slice(i + MATRIX_KEY_SEP.length);
  return { size: key.slice(0, i), color: colorPart.length ? colorPart : null };
}

function parseList(raw: string): string[] {
  return raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
}

function skuPart(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, "").toUpperCase().slice(0, 12) || "X";
}

function dedupeSkus(bases: string[]): string[] {
  const seen = new Map<string, number>();
  return bases.map((base) => {
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  });
}

function sortSizesList(sizes: string[]): string[] {
  const order = new Map(PRESET_SIZES.map((s, idx) => [s, idx]));
  return [...new Set(sizes)].sort((a, b) => {
    const ia = order.has(a) ? (order.get(a) as number) : 100;
    const ib = order.has(b) ? (order.get(b) as number) : 100;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b);
  });
}

function apiSizeToRow(s: string | null | undefined): string {
  const t = (s ?? "").trim();
  return t || "One size";
}

function rowSizeToApi(s: string): string | null {
  const t = s.trim();
  if (!t || t.toLowerCase() === "one size") return null;
  return t;
}

type VariantMatrixState = {
  presetSizes: string[];
  extraSizesRaw: string;
  colorsText: string;
  skuPrefix: string;
  basePrice: number;
  compareAt: number | "";
  stockByKey: Record<string, number>;
  skuByKey: Record<string, string>;
  priceMismatch: boolean;
};

function emptyMatrix(): VariantMatrixState {
  return {
    presetSizes: ["M"],
    extraSizesRaw: "",
    colorsText: "",
    skuPrefix: "",
    basePrice: 0,
    compareAt: "",
    stockByKey: {},
    skuByKey: {},
    priceMismatch: false,
  };
}

function matrixComboKeys(sizes: string[], colors: string[]): string[] {
  const keys: string[] = [];
  if (colors.length === 0) {
    for (const s of sizes) keys.push(encodeMatrixKey(s, null));
  } else {
    for (const s of sizes) {
      for (const c of colors) keys.push(encodeMatrixKey(s, c));
    }
  }
  return keys;
}

function matrixFromVariants(variants: AdminProduct["variants"]): VariantMatrixState {
  const vs = variants ?? [];
  if (vs.length === 0) return emptyMatrix();

  const rowSizes = [...new Set(vs.map((v) => apiSizeToRow(v.size)))];
  const presetSizes = PRESET_SIZES.filter((p) => rowSizes.includes(p));
  const presetList = PRESET_SIZES as readonly string[];
  const extraSizes = rowSizes.filter((r) => !presetList.includes(r));
  const extraSizesRaw = extraSizes.join(", ");

  const colorSet = new Set<string>();
  for (const v of vs) {
    const c = (v.color ?? "").trim();
    if (c) colorSet.add(c);
  }
  const colorsText = [...colorSet].sort((a, b) => a.localeCompare(b)).join("\n");

  const stockByKey: Record<string, number> = {};
  const skuByKey: Record<string, string> = {};
  for (const v of vs) {
    const sz = apiSizeToRow(v.size);
    const col = (v.color ?? "").trim() || null;
    const k = encodeMatrixKey(sz, col);
    stockByKey[k] = Number(v.stock_qty ?? 0);
    if (v.sku) skuByKey[k] = v.sku;
  }

  const prices = vs.map((v) => Number(v.price ?? 0));
  const priceMismatch = new Set(prices.map((p) => p.toFixed(2))).size > 1;
  const basePrice = prices[0] ?? 0;
  const cmp = vs.find((v) => v.compare_at_price != null)?.compare_at_price;
  const compareAt = cmp != null && cmp !== undefined ? Number(cmp) : "";

  return {
    presetSizes,
    extraSizesRaw,
    colorsText,
    skuPrefix: "",
    basePrice,
    compareAt,
    stockByKey,
    skuByKey,
    priceMismatch,
  };
}

function VariantMatrixSection({
  matrix,
  setMatrix,
}: {
  matrix: VariantMatrixState;
  setMatrix: Dispatch<SetStateAction<VariantMatrixState>>;
}) {
  const extraParsed = parseList(matrix.extraSizesRaw);
  const allSizes = sortSizesList([...matrix.presetSizes, ...extraParsed]);
  const colors = parseList(matrix.colorsText);
  const columnLabels = colors.length === 0 ? ["Standard"] : colors;

  const togglePreset = (size: string) => {
    setMatrix((m) => {
      const has = m.presetSizes.includes(size);
      const presetSizes = has ? m.presetSizes.filter((s) => s !== size) : [...m.presetSizes, size];
      return { ...m, presetSizes };
    });
  };

  const setStock = (key: string, qty: number) => {
    setMatrix((m) => ({
      ...m,
      stockByKey: { ...m.stockByKey, [key]: Number.isFinite(qty) && qty >= 0 ? qty : 0 },
    }));
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <Label>Variants: sizes × colours × stock</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Tick sizes, list colours once — they apply to every size. Set stock per cell; 0 stock disables that combination on the storefront.
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_SIZES.map((s) => {
            const on = matrix.presetSizes.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => togglePreset(s)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  on ? "border-primary bg-primary/15 text-foreground" : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <Label>Extra sizes (optional)</Label>
        <p className="text-xs text-muted-foreground mb-1">Comma-separated, e.g. 28, 30, 32</p>
        <Input
          value={matrix.extraSizesRaw}
          onChange={(e) => setMatrix((m) => ({ ...m, extraSizesRaw: e.target.value }))}
          placeholder="28, 30"
          className="bg-card"
        />
      </div>
      <div>
        <Label>Colours</Label>
        <p className="text-xs text-muted-foreground mb-1">
          One per line or comma-separated. Leave empty for one option per size (no separate colours).
        </p>
        <Textarea
          value={matrix.colorsText}
          onChange={(e) => setMatrix((m) => ({ ...m, colorsText: e.target.value }))}
          placeholder={"Navy\nBurgundy"}
          rows={3}
          className="bg-card"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label>Base price (₹)</Label>
          <Input
            type="number"
            min={0}
            step={1}
            value={matrix.basePrice}
            onChange={(e) => setMatrix((m) => ({ ...m, basePrice: Number(e.target.value) }))}
            className="bg-card"
          />
        </div>
        <div>
          <Label>Compare-at (₹, optional)</Label>
          <Input
            type="number"
            min={0}
            step={1}
            value={matrix.compareAt === "" ? "" : matrix.compareAt}
            placeholder="MSRP"
            className="bg-card"
            onChange={(e) => {
              const v = e.target.value;
              setMatrix((m) => ({ ...m, compareAt: v === "" ? "" : Number(v) }));
            }}
          />
        </div>
        <div>
          <Label>SKU prefix (optional)</Label>
          <Input
            value={matrix.skuPrefix}
            onChange={(e) => setMatrix((m) => ({ ...m, skuPrefix: e.target.value }))}
            placeholder="Auto from product slug"
            className="bg-card"
          />
        </div>
      </div>
      {matrix.priceMismatch && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Variants currently have different prices. Saving applies the base price above to every variant.
        </p>
      )}
      {allSizes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Select at least one size to edit stock.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border max-h-[min(50vh,24rem)] overflow-y-auto">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="p-2 text-left font-medium text-muted-foreground sticky left-0 bg-muted/40 z-10 min-w-[4rem] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                  Size
                </th>
                {columnLabels.map((label) => (
                  <th key={label} className="p-2 text-center font-medium text-muted-foreground min-w-[5.5rem]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allSizes.map((size) => (
                <tr key={size} className="border-b border-border last:border-0">
                  <td className="p-2 font-medium sticky left-0 bg-card z-10 border-r border-border/60 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                    {size}
                  </td>
                  {colors.length === 0 ? (
                    <td className="p-1 text-center">
                      <Input
                        type="number"
                        min={0}
                        className="h-9 text-center px-1 bg-card"
                        value={matrix.stockByKey[encodeMatrixKey(size, null)] ?? ""}
                        placeholder="0"
                        onChange={(e) =>
                          setStock(
                            encodeMatrixKey(size, null),
                            e.target.value === "" ? 0 : Number(e.target.value),
                          )
                        }
                      />
                    </td>
                  ) : (
                    colors.map((col) => {
                      const k = encodeMatrixKey(size, col);
                      return (
                        <td key={k} className="p-1 text-center">
                          <Input
                            type="number"
                            min={0}
                            className="h-9 text-center px-1 bg-card"
                            value={matrix.stockByKey[k] ?? ""}
                            placeholder="0"
                            onChange={(e) =>
                              setStock(k, e.target.value === "" ? 0 : Number(e.target.value))
                            }
                          />
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Existing SKUs are kept when the size/colour cell matches. New cells get an auto SKU from your prefix.
      </p>
    </div>
  );
}

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
  const [variantMatrix, setVariantMatrix] = useState<VariantMatrixState>(() => emptyMatrix());
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
      setVariantMatrix(emptyMatrix());
      setDraftImages([]);
      return;
    }
    setDraftName(editProduct.name);
    setDraftCategoryId(editProduct.category_id ?? "none");
    setDraftDescription(editProduct.description ?? "");
    setVariantMatrix(matrixFromVariants(editProduct.variants));
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

    const extraParsed = parseList(variantMatrix.extraSizesRaw);
    const allSizes = sortSizesList([...variantMatrix.presetSizes, ...extraParsed]);
    const colors = parseList(variantMatrix.colorsText);

    if (allSizes.length === 0) {
      toast({ title: "Select at least one size", variant: "destructive" });
      return;
    }

    const keys = matrixComboKeys(allSizes, colors);
    const slugPart = skuPart(slug.replace(/-/g, "")) || "ITEM";
    const prefixRaw = variantMatrix.skuPrefix.trim() || slugPart;
    const baseSku = prefixRaw.replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 40) || "SKU";

    const rows = keys.map((key) => {
      const { size, color } = parseMatrixKey(key);
      const stock = Math.max(0, Math.floor(Number(variantMatrix.stockByKey[key] ?? 0)));
      const preserved = variantMatrix.skuByKey[key];
      const auto = `${baseSku}-${skuPart(size)}-${color ? skuPart(color) : "STD"}`;
      return { key, size, color, stock, sku: preserved || auto };
    });
    const skus = dedupeSkus(rows.map((r) => r.sku));

    const variants = rows.map((r, i) => ({
      sku: skus[i],
      size: rowSizeToApi(r.size),
      color: r.color,
      price: Number(variantMatrix.basePrice) || 0,
      compare_at_price: variantMatrix.compareAt === "" ? null : Number(variantMatrix.compareAt),
      stock_qty: r.stock,
      low_stock_threshold: 5,
      is_active: r.stock > 0,
    }));

    if (variants.length === 0) {
      toast({ title: "No variants to save", variant: "destructive" });
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
                      <p className="text-xs text-muted-foreground">{p.category} · {p.sizes.length ? p.sizes.join(", ") : "—"}</p>
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

              <VariantMatrixSection matrix={variantMatrix} setMatrix={setVariantMatrix} />

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
