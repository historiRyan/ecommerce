import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import type { Product } from "@/data/products";

type WishlistContextValue = {
  ids: string[];
  has: (id: string | number) => boolean;
  toggle: (p: Product) => void;
  items: Product[];
  setItems: (p: Product[]) => void;
  count: number;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("tokoryan_wishlist");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem("tokoryan_wishlist", JSON.stringify(ids));
    } catch {
      /* abaikan */
    }
  }, [ids]);

  const has = useCallback((id: string | number) => ids.includes(String(id)), [ids]);

  const toggle = useCallback((p: Product) => {
    setIds((prev) =>
      prev.includes(String(p.id))
        ? prev.filter((x) => x !== String(p.id))
        : [...prev, String(p.id)]
    );
  }, []);

  const count = useMemo(() => ids.length, [ids]);

  return (
    <WishlistContext.Provider value={{ ids, has, toggle, items, setItems, count }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
