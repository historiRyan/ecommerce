import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import type { Product } from "@/data/products";

export type CartItem = {
  product: Product;
  quantity: number;
  color: string;
  size: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, quantity: number, color: string, size: string) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem: CartContextValue["addItem"] = (product, quantity, color, size) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product.id === product.id && i.color === color && i.size === size
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity, color, size }];
    });
  };

  const removeItem: CartContextValue["removeItem"] = (id) => {
    setItems((prev) => prev.filter((i) => String(i.product.id) !== String(id)));
  };

  const updateQuantity: CartContextValue["updateQuantity"] = (id, quantity) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (String(i.product.id) === String(id) ? { ...i, quantity } : i))
    );
  };

  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.product.price * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clear, count, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
