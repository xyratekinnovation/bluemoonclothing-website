import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost, type ApiCart } from "@/lib/api";
import { BLUEMOON_AUTH_CHANGED } from "@/lib/auth-events";

function readAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  variantId: string;
  size: string;
  color: string | null;
  quantity: number;
  unitPrice: number;
}

interface CartContextType {
  items: CartItem[];
  addVariant: (variantId: string, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(readAccessToken);
  const isLoggedIn = Boolean(accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    const sync = () => setAccessToken(readAccessToken());
    window.addEventListener(BLUEMOON_AUTH_CHANGED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BLUEMOON_AUTH_CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => apiGet<ApiCart>("/cart", true),
    enabled: isLoggedIn,
    staleTime: 30_000,
    retry: false,
  });

  const items = useMemo<CartItem[]>(() => {
    if (!cart) return [];
    return cart.items
      .filter((item) => Boolean((item as any).variant?.product))
      .map((item) => ({
        id: item.id,
        productId: item.variant.product.id,
        productName: item.variant.product.name,
        productSlug: item.variant.product.slug,
        sku: item.variant.sku,
        variantId: item.variant.id,
        size: item.variant.size ?? "",
        color: item.variant.color,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price_snapshot ?? item.variant.price ?? 0),
      }));
  }, [cart]);

  const addMutation = useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      apiPost<ApiCart>("/cart/items", { product_variant_id: variantId, quantity }, true),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
  const patchMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      apiPatch<ApiCart>(`/cart/items/${itemId}`, { quantity }, true),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => apiDelete(`/cart/items/${itemId}`, true),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
  const clearMutation = useMutation({
    mutationFn: () => apiDelete("/cart", true),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addVariant: async (variantId, quantity = 1) => {
          if (!isLoggedIn) throw new Error("Please login to add items to cart.");
          await addMutation.mutateAsync({ variantId, quantity });
        },
        removeItem: async (itemId) => {
          if (!isLoggedIn) throw new Error("Please login to manage cart.");
          await deleteMutation.mutateAsync(itemId);
        },
        updateQuantity: async (itemId, quantity) => {
          if (!isLoggedIn) throw new Error("Please login to manage cart.");
          await patchMutation.mutateAsync({ itemId, quantity });
        },
        clearCart: async () => {
          if (!isLoggedIn) throw new Error("Please login to manage cart.");
          await clearMutation.mutateAsync();
        },
        totalItems,
        totalPrice,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
