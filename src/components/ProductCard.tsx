import type { Product } from "@/data/products";
import { formatPrice } from "@/data/products";
import { StarRating } from "@/components/StarRating";
import { ShoppingBag } from "lucide-react";

export function ProductCard({
  product,
  onOpen,
  onQuickAdd,
}: {
  product: Product;
  onOpen: () => void;
  onQuickAdd: () => void;
}) {
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div
      onClick={onOpen}
      className="group relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60"
    >
      {discount > 0 && (
        <span className="absolute left-4 top-4 z-10 rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
          -{discount}%
        </span>
      )}
      {!product.inStock && (
            <span className="absolute right-4 top-4 z-10 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white">
              Stok habis
            </span>
      )}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd();
          }}
          className="absolute bottom-3 left-3 right-3 flex translate-y-3 items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white opacity-0 shadow-lg transition-all duration-300 hover:bg-indigo-600 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ShoppingBag size={16} /> Tambah cepat
        </button>
      </div>
      <div className="px-1 pt-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-indigo-600">
          {product.category}
        </p>
        <h3 className="mt-1 truncate text-sm font-semibold text-slate-900">
          {product.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5">
          <StarRating rating={product.rating} size={13} />
          <span className="text-xs text-slate-500">({product.reviewCount})</span>
        </div>
        <div className="mt-2 flex flex-col gap-0.5">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2 overflow-hidden">
            <span className="min-w-0 truncate text-sm font-bold text-slate-900">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="min-w-0 shrink-0 truncate text-xs text-slate-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="w-max rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 overflow-hidden text-xs">
          <span className={`truncate font-medium ${(product.stockQuantity ?? 0) > 0 ? "text-emerald-600" : "text-rose-600"}`}>
            Stock: {product.stockQuantity ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}
