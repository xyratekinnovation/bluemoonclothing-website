import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Loader2, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  apiGet,
  apiPostFormData,
  apiPut,
  resolveUploadedAssetUrl,
  type HeroBannerPayload,
} from "@/lib/api";

export default function HeroBannerPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [desktopPath, setDesktopPath] = useState("");
  const [mobilePath, setMobilePath] = useState("");
  const [uploading, setUploading] = useState<"desktop" | "mobile" | null>(null);
  const desktopFileRef = useRef<HTMLInputElement>(null);
  const mobileFileRef = useRef<HTMLInputElement>(null);

  const { data, isPending } = useQuery({
    queryKey: ["hero-banner"],
    queryFn: () => apiGet<HeroBannerPayload>("/storefront/hero-banner"),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!data) return;
    setDesktopPath(data.desktop_url ?? "");
    setMobilePath(data.mobile_url ?? "");
  }, [data]);

  const persistBanner = async (d: string, m: string) => {
    await apiPut("/settings/hero_banner", {
      value: {
        desktop_url: d.trim() || null,
        mobile_url: m.trim() || null,
      },
    });
    await queryClient.invalidateQueries({ queryKey: ["hero-banner"] });
  };

  const saveMutation = useMutation({
    mutationFn: () => persistBanner(desktopPath, mobilePath),
    onSuccess: () => toast({ title: "Hero banner saved" }),
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const uploadFile = async (file: File, slot: "desktop" | "mobile") => {
    setUploading(slot);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await apiPostFormData<{ url: string }>("/uploads/image", fd);
      const nextD = slot === "desktop" ? url : desktopPath.trim();
      const nextM = slot === "mobile" ? url : mobilePath.trim();
      setDesktopPath(nextD);
      setMobilePath(nextM);
      await persistBanner(nextD, nextM);
      toast({ title: "Hero banner updated on storefront" });
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const desktopPreview = resolveUploadedAssetUrl(desktopPath);
  const mobilePreview = resolveUploadedAssetUrl(mobilePath);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Homepage hero banner</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload separate images for desktop and mobile. The storefront uses the mobile file below{" "}
          <span className="text-foreground font-medium">768px</span> width when set; otherwise the desktop file. The
          the live site uses a <span className="text-foreground font-medium">full-bleed</span> photo with the subject
          anchored to the <span className="text-foreground font-medium">top-right</span> on desktop (best for wide art
          with people on the right). Use a <span className="text-foreground font-medium">high-resolution</span> file so
          it stays crisp. For a sharp banner on large screens, use
          desktop images at least{" "}
          <span className="text-foreground font-medium">2400px wide</span> (JPEG/PNG quality 85%+); mobile at least{" "}
          <span className="text-foreground font-medium">1080px wide</span>. If nothing is saved, the default hero is
          shown.
        </p>
      </div>

      {isPending ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading current banner…
        </div>
      ) : (
        <div className="space-y-8">
          <section className="rounded-xl border border-border bg-card p-6 card-shadow space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="w-4 h-4 text-primary" />
              Desktop banner
            </div>
            <p className="text-xs text-muted-foreground">
              Wide landscape; aim for <strong className="font-medium text-foreground">≥ 2560×1440</strong> (or larger)
              and export at high JPEG quality or WebP — the hero is full-width, so small files look soft. Uploads up to
              20MB.
            </p>
            <input
              ref={desktopFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading !== null}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void uploadFile(f, "desktop");
              }}
            />
            {desktopPreview ? (
              <div className="relative aspect-[21/9] max-h-48 rounded-lg overflow-hidden border border-border bg-muted">
                <img src={desktopPreview} alt="Desktop preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-[21/9] max-h-48 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                No desktop image yet
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading !== null}
                onClick={() => desktopFileRef.current?.click()}
              >
                {uploading === "desktop" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload from computer
              </Button>
              {desktopPath ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setDesktopPath("")}>
                  <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                  Clear
                </Button>
              ) : null}
            </div>
            {desktopPath ? (
              <p className="text-[11px] text-muted-foreground font-mono break-all">Stored path: {desktopPath}</p>
            ) : null}
          </section>

          <section className="rounded-xl border border-border bg-card p-6 card-shadow space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="w-4 h-4 text-primary" />
              Mobile banner
            </div>
            <p className="text-xs text-muted-foreground">
              Portrait or tall; aim for <strong className="font-medium text-foreground">≥ 1080px wide</strong> on the
              short edge for clarity on phones.
            </p>
            <input
              ref={mobileFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading !== null}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void uploadFile(f, "mobile");
              }}
            />
            {mobilePreview ? (
              <div className="relative aspect-[9/16] max-w-[200px] rounded-lg overflow-hidden border border-border bg-muted mx-auto sm:mx-0">
                <img src={mobilePreview} alt="Mobile preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-[9/16] max-w-[200px] rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground mx-auto sm:mx-0">
                No mobile image (desktop will be used)
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading !== null}
                onClick={() => mobileFileRef.current?.click()}
              >
                {uploading === "mobile" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload from computer
              </Button>
              {mobilePath ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setMobilePath("")}>
                  <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                  Clear
                </Button>
              ) : null}
            </div>
            {mobilePath ? (
              <p className="text-[11px] text-muted-foreground font-mono break-all">Stored path: {mobilePath}</p>
            ) : null}
          </section>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="gold-gradient text-primary-foreground"
              disabled={saveMutation.isPending || uploading !== null}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save to storefront
            </Button>
            <p className="text-xs text-muted-foreground self-center w-full sm:w-auto">
              New uploads apply to the storefront immediately. Use save after clearing an image or if you changed paths manually.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
