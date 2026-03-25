import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Truck, RotateCcw } from "lucide-react";
import Layout from "@/components/Layout";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";

const CheckoutPage = () => {
  const { items, totalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", address: "", city: "", state: "", pincode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isLoggedIn = Boolean(localStorage.getItem("access_token"));
    if (!isLoggedIn) {
      toast.error("Please login before placing an order.");
      return;
    }
    try {
      await apiPost("/orders/checkout", { shipping_total: 0, tax_total: 0, discount_total: 0 }, true);
      toast.success("Order placed successfully! 🎉");
      clearCart();
    } catch {
      toast.error("Unable to place order. Please try again.");
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-serif text-3xl text-foreground mb-4">No items to checkout</h1>
          <Link to="/" className="bg-gold-gradient text-primary-foreground px-6 py-3 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
            Shop Now
          </Link>
        </div>
      </Layout>
    );
  }

  const inputCls = "w-full border border-border rounded-md px-4 py-3 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-shadow";

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-4xl">
        <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-8">Checkout</h1>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-5 gap-8">
          {/* Form */}
          <div className="md:col-span-3 space-y-4">
            <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">Shipping Details</h2>
            <input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className={inputCls} required />
            <div className="grid grid-cols-2 gap-4">
              <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className={inputCls} required />
              <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className={inputCls} required />
            </div>
            <input name="address" placeholder="Address" value={formData.address} onChange={handleChange} className={inputCls} required />
            <div className="grid grid-cols-3 gap-4">
              <input name="city" placeholder="City" value={formData.city} onChange={handleChange} className={inputCls} required />
              <input name="state" placeholder="State" value={formData.state} onChange={handleChange} className={inputCls} required />
              <input name="pincode" placeholder="Pincode" value={formData.pincode} onChange={handleChange} className={inputCls} required />
            </div>

            {/* Trust */}
            <div className="flex gap-6 pt-4">
              {[
                { icon: ShieldCheck, text: "Secure Checkout" },
                { icon: Truck, text: "Free Delivery" },
                { icon: RotateCcw, text: "Easy Returns" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="w-4 h-4 text-primary" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="md:col-span-2">
            <div className="border border-border rounded-lg p-6 sticky top-24">
              <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex justify-between text-sm">
                    <span className="text-muted-foreground line-clamp-1">{item.product.name} × {item.quantity}</span>
                    <span className="text-foreground font-medium">₹{(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 mb-6 flex justify-between font-semibold text-foreground">
                <span>Total</span>
                <span>₹{totalPrice.toLocaleString()}</span>
              </div>
              <button
                type="submit"
                className="w-full bg-gold-gradient text-primary-foreground py-3.5 rounded-md text-sm font-medium tracking-wide hover:opacity-90 transition-opacity"
              >
                Place Order
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
