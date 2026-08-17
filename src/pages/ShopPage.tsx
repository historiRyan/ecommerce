import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, ChevronDown, X, Check } from "lucide-react";
import { useProducts } from "@/context/ProductsContext";
import type { Product, Category } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { StarRating } from "@/components/StarRating";
import { useCart } from "@/context/CartContext";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest";

const sortOptions: { id: SortKey; label: string }[] = [
  { id: "featured", label: "Unggulan" },
  { id: "price-asc", label: "Harga: Rendah ke Tinggi" },
  { id: "price-desc", label: "Harga: Tinggi ke Rendah" },
  { id: "rating", label: "Terbaik" },
  { id: "newest", label: "Terbaru" },
];

export function ShopPage({ onOpenProduct }: { onOpenProduct: (p: Product) => void }) {
  const { products, categories, loading } = useProducts();
  const { addItem } = useCart();
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortKey>("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const slug = e.detail as string;
      setSelectedCats((prev) => {
        const cat = categories.find((c) => c.slug === slug);
        if (!cat) return prev;
        return prev.includes(cat.name) ? prev : [...prev, cat.name];
      });
    };
    window.addEventListener("shop-filter-category", handler as EventListener);
    return () => window.removeEventListener("shop-filter-category", handler as EventListener);
  }, [categories]);

  const toggleCat = (name: string) =>
    setSelectedCats((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );

  const maxProduct = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.max(...products.map((p) => p.price));
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (selectedCats.length && !selectedCats.includes(p.category)) return false;
      if (maxPrice !== null && p.price > maxPrice) return false;
      if (minRating > 0 && p.rating < minRating) return false;
      return true;
    });
    switch (sort) {
      case "price-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "rating": list = [...list].sort((a, b) => b.rating - a.rating); break;
      case "newest": list = [...list].sort((a, b) => String(b.id) > String(a.id) ? 1 : -1); break;
      default: list = [...list].sort((a, b) => (b.featured === a.featured ? 0 : b.featured ? 1 : -1) || b.reviewCount - a.reviewCount); break;
    }
    return list;
  }, [products, selectedCats, maxPrice, minRating, sort]);

  const resetFilters = () => {
    setSelectedCats([]);
    setMaxPrice(null);
    setMinRating(0);
  };

  const activeFilterCount =
    selectedCats.length + (minRating > 0 ? 1 : 0) + (maxPrice !== null ? 1 : 0);

  const catWithAll: Category[] = [{ id: "all", name: "Semua", slug: "all", count: products.length }, ...categories];

  const FilterPanel = (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Kategori</h3>
        <div className="space-y-1.5">
          {catWithAll.map((c) => {
            const checked = c.id === "all" ? selectedCats.length === 0 : selectedCats.includes(c.name);
            return (
              <label key={c.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <span
                  className={`grid h-4.5 w-4.5 place-items-center rounded border transition-colors ${
                    checked
                      ? "border-indigo-600 bg-indigo-600"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {checked && <Check size={12} className="text-white" />}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => c.id === "all" ? resetFilters() : toggleCat(c.name)}
                  className="sr-only"
                />
                <span className="flex-1 text-slate-700">{c.name}</span>
                <span className="text-xs text-slate-400">{c.count}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-slate-200" />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Harga maksimal</h3>
          <span className="text-sm font-medium text-indigo-600">
            {maxPrice === null ? "Tidak terbatas" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(maxPrice)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={maxProduct}
          value={maxPrice === null ? maxProduct : maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="h-px bg-slate-200" />

      <div>
        <h3 className="text-sm font-semibold text-slate-900">Rating minimal</h3>
        <div className="space-y-1.5">
          {[0, 4, 4.5, 4.8].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                minRating === r ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {r === 0 ? (
                <span className="font-medium">Semua rating</span>
              ) : (
                <>
                  <StarRating rating={r} size={13} />
                  <span>{r} ke atas</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={resetFilters}
          className="w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Hapus semua filter
        </button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500">Memuat produk...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Semua produk
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {filtered.length} {filtered.length === 1 ? "hasil" : "hasil"}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 lg:hidden">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
        >
          <SlidersHorizontal size={16} /> Filter
          {activeFilterCount > 0 && (
            <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        <SortDropdown sort={sort} sortOpen={sortOpen} setSortOpen={setSortOpen} setSort={setSort} />
      </div>

      <div className="mt-6 flex gap-8">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5">
            {FilterPanel}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 hidden items-center justify-end lg:flex">
            <SortDropdown sort={sort} sortOpen={sortOpen} setSortOpen={setSortOpen} setSort={setSort} />
          </div>
          {filtered.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 py-24 text-center">
              <p className="text-sm font-medium text-slate-600">Tidak ada produk yang cocok dengan filter Anda.</p>
              <button onClick={resetFilters} className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Hapus filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {filtered.map((p) => (
                <ProductCard
                  key={typeof p.id === "string" ? p.id : p.id}
                  product={p}
                  onOpen={() => onOpenProduct(p)}
                  onQuickAdd={() => addItem(p, 1, p.colors[0]?.name ?? "Default", p.sizes[0] ?? "One Size")}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Filter</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            {FilterPanel}
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-6 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white"
            >
              Tampilkan {filtered.length} hasil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortDropdown({
  sort,
  sortOpen,
  setSortOpen,
  setSort,
}: {
  sort: SortKey;
  sortOpen: boolean;
  setSortOpen: (v: boolean) => void;
  setSort: (s: SortKey) => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => setSortOpen(!sortOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        Sort: {sortOptions.find((o) => o.id === sort)?.label}
        <ChevronDown size={15} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
      </button>
      {sortOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {sortOptions.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setSort(o.id);
                  setSortOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                  sort === o.id ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {o.label}
                {sort === o.id && <Check size={15} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
