import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import { useCart } from "@/context/CartContext";

const CartPage = () => {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="font-serif text-3xl text-foreground mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground text-sm mb-8">Looks like you haven't added anything yet.</p>
          <Link to="/" className="bg-gold-gradient text-primary-foreground px-6 py-3 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
            Continue Shopping
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>
        <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-8">Shopping Cart</h1>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={`${item.product.id}-${item.size}`} className="flex gap-4 p-4 border border-border rounded-lg">
                <Link to={`/product/${item.product.id}`} className="w-20 h-24 rounded-md overflow-hidden bg-secondary shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1">
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">Size: {item.size}</p>
                  <p className="text-sm font-semibold text-primary mt-1">₹{item.product.price.toLocaleString()}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="inline-flex items-center border border-border rounded-md">
                      <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)} className="p-1.5">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-xs font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)} className="p-1.5">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.product.id, item.size)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="md:sticky md:top-24 h-fit">
            <div className="border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-primary font-medium">Free</span>
                </div>
              </div>
              <div className="border-t border-border pt-3 mb-6 flex justify-between font-semibold text-foreground">
                <span>Total</span>
                <span>₹{totalPrice.toLocaleString()}</span>
              </div>
              <Link
                to="/checkout"
                className="block w-full bg-gold-gradient text-primary-foreground py-3.5 rounded-md text-sm font-medium tracking-wide text-center hover:opacity-90 transition-opacity"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky summary */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-background border-t border-border p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-semibold text-foreground">₹{totalPrice.toLocaleString()}</p>
        </div>
        <Link to="/checkout" className="bg-gold-gradient text-primary-foreground px-6 py-3 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          Checkout
        </Link>
      </div>
    </Layout>
  );
};

export default CartPage;
