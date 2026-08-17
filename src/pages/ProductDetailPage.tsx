import { useState } from "react";
import {
  ChevronLeft,
  Minus,
  Plus,
  ShoppingBag,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Heart,
} from "lucide-react";
import type { Product } from "@/data/products";
import { products, formatPrice } from "@/data/products";
import { StarRating } from "@/components/StarRating";
import { SlideshowGallery } from "@/components/SlideshowGallery";
import { ChatWidget } from "@/components/ChatWidget";
import { ProductReview } from "@/components/ProductReview";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import type { Tab } from "@/components/Navbar";

export function ProductDetailPage({
  product,
  onTabChange,
  onOpenProduct,
}: {
  product: Product;
  onTabChange: (tab: Tab) => void;
  onOpenProduct: (p: Product) => void;
}) {
  const { addItem } = useCart();
  const { profile } = useAuth();
  const [color, setColor] = useState(product.colors[0]?.name ?? "Default");
  const [size, setSize] = useState(product.sizes[0] ?? "One Size");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const maxQty = product.stockQuantity ?? 0;
  const isOutOfStock = maxQty <= 0;

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    if (qty > maxQty) {
      setQty(maxQty);
      return;
    }
    addItem(product, qty, color, size);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
        <button onClick={() => onTabChange("shop")} className="hover:text-indigo-600">Toko</button>
        <ChevronLeft size={14} className="rotate-180" />
        <span className="capitalize text-slate-700">{product.category}</span>
        <ChevronLeft size={14} className="rotate-180" />
        <span className="truncate text-slate-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <SlideshowGallery images={product.images} alt={product.name} />
        </div>

        {/* Specs */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
            {product.category}
          </p>
          <h1 className="mt-1.5 text-3xl font-bold text-slate-900">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={product.rating} size={18} />
            <span className="text-sm font-medium text-slate-700">{product.rating}</span>
            <span className="text-sm text-slate-400">·</span>
            <button className="text-sm text-slate-500 hover:text-indigo-600">
              {product.reviewCount} reviews
            </button>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-lg text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
            )}
            {discount > 0 && (
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            Hemat {formatPrice((product.originalPrice ?? 0) - product.price)}
          </span>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-600">{product.description}</p>

          {/* Colors */}
          {product.colors.length > 0 && (
            <div className="mt-7">
              <p className="mb-2.5 text-sm font-semibold text-slate-900">
                Color: <span className="font-normal text-slate-600">{color}</span>
              </p>
              <div className="flex gap-2.5">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    title={c.name}
                    className={`grid h-9 w-9 place-items-center rounded-full ring-2 ring-offset-2 transition-all ${
                      color === c.name ? "ring-indigo-600" : "ring-transparent hover:ring-slate-300"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {color === c.name && (
                      <Check
                        size={16}
                        className={c.hex === "#f8fafc" || c.hex === "#e2e8f0" || c.hex === "#e2c9c9" || c.hex === "#d6c3a5" || c.hex === "#e7e5e4" || c.hex === "#cbd5e1" || c.hex === "#f1f5f9" ? "text-slate-900" : "text-white"}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes.length > 0 && (
          <div className="mt-6">
            <p className="mb-2.5 text-sm font-semibold text-slate-900">
              {product.sizes.length > 1 ? "Ukuran" : "Pilihan"}: <span className="font-normal text-slate-600">{size}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`min-w-[3rem] rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    size === s
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Quantity + add */}
          {isOutOfStock && (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              Maaf, stok produk ini sedang habis.
            </div>
          )}
          <div className="mt-7 flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-200">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={isOutOfStock}
                className="grid h-11 w-11 place-items-center text-slate-600 transition-colors hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus size={16} />
              </button>
              <span className="w-10 text-center text-sm font-semibold text-slate-900">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={isOutOfStock || qty >= maxQty}
                className="grid h-11 w-11 place-items-center text-slate-600 transition-colors hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
             <button
               onClick={handleAdd}
               disabled={isOutOfStock}
               className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                 added ? "bg-emerald-600 shadow-emerald-600/30" : "bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-500"
               }`}
             >
               {added ? (
                 <><Check size={18} /> Ditambahkan ke keranjang</>
               ) : (
                 <><ShoppingBag size={18} /> Tambahkan ke keranjang</>
               )}
             </button>
             <button
               onClick={() => {
                 if (isOutOfStock) return;
                 addItem(product, Math.min(qty, maxQty), color, size);
                 onTabChange("cart");
               }}
               disabled={isOutOfStock}
               className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-indigo-600 py-3 text-sm font-semibold text-indigo-600 shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
             >
               <span>Beli sekarang</span>
             </button>
              <button className="grid h-12 w-12 place-items-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:border-slate-300 hover:text-rose-500">
                <Heart size={20} />
              </button>
           </div>

           {product.createdBy && profile && profile.role === "customer" && (
             <div className="mt-6">
               <ChatWidget product={product} />
             </div>
           )}

          {/* Features */}
          {product.features.length > 0 && (
          <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {product.features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check size={13} />
                </span>
                {f}
              </div>
            ))}
          </div>
          )}

          {/* Assurance */}
          <div className="mt-7 grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {[
               { icon: Truck, label: "Gratis ongkir" },
               { icon: ShieldCheck, label: "Garansi 2 tahun" },
               { icon: RotateCcw, label: "Pengembalian 30 hari" },
             ].map((a) => (
              <div key={a.label} className="flex flex-col items-center gap-1.5 text-center">
                <a.icon size={20} className="text-indigo-600" />
                <span className="text-xs font-medium text-slate-600">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16">
        <div className="mb-6 flex items-center gap-4">
          <StarRating rating={product.rating} size={20} />
          <span className="text-sm font-medium text-slate-700">
            {product.rating.toFixed(1)} dari {product.reviewCount} ulasan
          </span>
        </div>
        <ProductReview product={product} onTabChange={onTabChange} />
      </section>

      {/* Related */}
      <RelatedProducts current={product} onOpenProduct={onOpenProduct} />
    </div>
  );
}

function RelatedProducts({
  current,
  onOpenProduct,
}: {
  current: Product;
  onOpenProduct: (p: Product) => void;
}) {
  const related = products
    .filter((p) => p.category === current.category && p.id !== current.id)
    .slice(0, 4);
  if (related.length === 0) return null;
  return (
    <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Produk lain yang cocok</h2>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        {related.map((p) => (
          <button
            key={p.id}
            onClick={() => onOpenProduct(p)}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 text-left transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
              <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <h3 className="mt-3 truncate text-sm font-semibold text-slate-900">{p.name}</h3>
            <p className="mt-1 text-sm font-bold text-slate-900">{formatPrice(p.price)}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
