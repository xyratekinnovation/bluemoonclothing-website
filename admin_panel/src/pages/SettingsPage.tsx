import { useMutation, useQuery } from "@tanstack/react-query";
import { Save, Store, Mail, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPut } from "@/lib/api";

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: settings = [] } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => apiGet<{ key: string; value: Record<string, unknown> }[]>("/settings"),
  });
  const upsertMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: Record<string, unknown> }) => apiPut(`/settings/${key}`, { value }),
  });

  const getValue = (key: string, field: string, fallback = "") =>
    ((settings.find((item) => item.key === key)?.value?.[field] as string | undefined) ?? fallback);

  const handleSave = async (key: string, value: Record<string, unknown>) => {
    await upsertMutation.mutateAsync({ key, value });
    toast({ title: "Settings saved", description: "Your changes have been saved successfully." });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Tabs defaultValue="store">
        <TabsList className="bg-muted">
          <TabsTrigger value="store"><Store className="w-4 h-4 mr-1.5" /> Store</TabsTrigger>
          <TabsTrigger value="tax"><DollarSign className="w-4 h-4 mr-1.5" /> Tax</TabsTrigger>
          <TabsTrigger value="email"><Mail className="w-4 h-4 mr-1.5" /> Email</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="mt-4">
          <div className="bg-card rounded-xl p-6 card-shadow space-y-4 max-w-lg">
            <div><Label>Store Name</Label><Input id="store-name" defaultValue={getValue("store", "store_name", "Bluemoon Clothing")} /></div>
            <div><Label>Contact Email</Label><Input id="store-email" defaultValue={getValue("store", "contact_email", "hello@bluemoonclothing.in")} /></div>
            <div><Label>Phone</Label><Input id="store-phone" defaultValue={getValue("store", "phone", "+91 98765 43210")} /></div>
            <div><Label>Address</Label><Textarea id="store-address" defaultValue={getValue("store", "address", "123 Fashion Street, Mumbai, Maharashtra 400001")} rows={3} /></div>
            <div><Label>Currency</Label><Input defaultValue="INR (₹)" disabled /></div>
            <Button
              onClick={() => handleSave("store", {
                store_name: (document.getElementById("store-name") as HTMLInputElement)?.value ?? "",
                contact_email: (document.getElementById("store-email") as HTMLInputElement)?.value ?? "",
                phone: (document.getElementById("store-phone") as HTMLInputElement)?.value ?? "",
                address: (document.getElementById("store-address") as HTMLTextAreaElement)?.value ?? "",
              })}
              className="gold-gradient text-primary-foreground"
            >
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="tax" className="mt-4">
          <div className="bg-card rounded-xl p-6 card-shadow space-y-4 max-w-lg">
            <div><Label>GST Number</Label><Input id="tax-gst" defaultValue={getValue("tax", "gst_number", "27AABCU9603R1ZM")} /></div>
            <div><Label>Tax Rate (%)</Label><Input id="tax-rate" type="number" defaultValue={getValue("tax", "tax_rate", "18")} /></div>
            <div><Label>Tax Inclusive Pricing</Label>
              <select id="tax-inclusive" defaultValue={getValue("tax", "tax_inclusive", "yes")} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1">
                <option>Yes - Prices include tax</option>
                <option>No - Tax added at checkout</option>
              </select>
            </div>
            <Button
              onClick={() => handleSave("tax", {
                gst_number: (document.getElementById("tax-gst") as HTMLInputElement)?.value ?? "",
                tax_rate: (document.getElementById("tax-rate") as HTMLInputElement)?.value ?? "",
                tax_inclusive: (document.getElementById("tax-inclusive") as HTMLSelectElement)?.value ?? "",
              })}
              className="gold-gradient text-primary-foreground"
            >
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <div className="bg-card rounded-xl p-6 card-shadow space-y-4 max-w-lg">
            <div><Label>Order Confirmation Subject</Label><Input id="email-order-sub" defaultValue={getValue("email", "order_subject", "Your Bluemoon order is confirmed!")} /></div>
            <div><Label>Shipping Notification Subject</Label><Input id="email-ship-sub" defaultValue={getValue("email", "shipping_subject", "Your order is on its way!")} /></div>
            <div><Label>Footer Text</Label><Textarea id="email-footer" defaultValue={getValue("email", "footer_text", "Thank you for shopping with Bluemoon Clothing. Every fit feels like a blue moon.")} rows={3} /></div>
            <Button
              onClick={() => handleSave("email", {
                order_subject: (document.getElementById("email-order-sub") as HTMLInputElement)?.value ?? "",
                shipping_subject: (document.getElementById("email-ship-sub") as HTMLInputElement)?.value ?? "",
                footer_text: (document.getElementById("email-footer") as HTMLTextAreaElement)?.value ?? "",
              })}
              className="gold-gradient text-primary-foreground"
            >
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
