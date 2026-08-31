import { useEffect } from "react";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useProducts } from "@/context/ProductsContext";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import type { Tab } from "@/components/Navbar";
import type { Product } from "@/data/products";

export function WishlistPage({ onTabChange }: { onTabChange: (tab: Tab) => void }) {
  const { ids, setItems } = useWishlist();
  const { products } = useProducts();
  const { addItem } = useCart();

  useEffect(() => {
    const list = products.filter((p) => ids.includes(String(p.id)));
    setItems(list);
  }, [ids, products, setItems]);

  if (ids.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-rose-50 text-rose-500">
          <Heart size={32} />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Wishlist Anda kosong</h1>
        <p className="mt-2 text-slate-500">Tap ikon hati pada produk untuk menyimpannya di sini.</p>
        <button
          onClick={() => onTabChange("shop")}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Jelajahi produk <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Wishlist</h1>
      <p className="mt-1 text-sm text-slate-500">{ids.length} {ids.length === 1 ? "item" : "item"} tersimpan</p>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products
          .filter((p) => ids.includes(String(p.id)))
          .map((p: Product) => (
            <ProductCard
              key={String(p.id)}
              product={p}
              onOpen={() => onTabChange("product")}
              onQuickAdd={() => addItem(p, 1, p.colors[0]?.name ?? "Default", p.sizes[0] ?? "One Size")}
            />
          ))}
      </div>
    </div>
  );
}
