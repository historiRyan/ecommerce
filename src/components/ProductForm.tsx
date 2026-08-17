import { useRef, useState } from "react";
import { X, Upload, Plus } from "lucide-react";
import type { Category } from "@/data/products";

export type ProductFormValue = {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: string;
  originalPrice: string;
  discountPercent: string;
  categoryId: string;
  inStock: boolean;
  featured: boolean;
  stockQuantity: string;
  images: File[];
  existingImages: string[];
  existingImagePaths: string[];
  existingImageIds: string[];
};

const emptyForm = (): ProductFormValue => ({
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  price: "",
  originalPrice: "",
  discountPercent: "",
  categoryId: "",
  inStock: true,
  featured: false,
  stockQuantity: "",
  images: [],
  existingImages: [],
  existingImagePaths: [],
  existingImageIds: [],
});

export function ProductForm({
  initial,
  categories,
  onSubmit,
  onCancel,
  loading,
  errorMsg,
}: {
  initial?: Partial<ProductFormValue>;
  categories: Category[];
  onSubmit: (v: ProductFormValue, removeImagePath: string[], removeImageId: string[]) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  errorMsg: string | null;
}) {
  const [form, setForm] = useState<ProductFormValue>({ ...emptyForm(), ...initial });
  const fileInputRef = useRef<HTMLInputElement>(null);

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const computeOriginalFromDiscount = (price: string, discount: string): string => {
  const p = parseFloat(price);
  const d = parseFloat(discount);
  if (!p || isNaN(p) || !d || isNaN(d) || d <= 0 || d >= 100) return "";
  return String(Math.round((p / (100 - d)) * 100));
};

const computeDiscountPercent = (price: string, original: string): string => {
  const p = parseFloat(price);
  const o = parseFloat(original);
  if (!p || !o || p >= o || o <= 0) return "";
  return String(Math.round(((o - p) / o) * 100));
};

  const generateUniqueSlug = (base: string) => {
    const random = crypto.randomUUID().slice(0, 8);
    return `${slugify(base)}-${random}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue;
      valid.push(f);
    }
    setForm((f) => ({ ...f, images: [...f.images, ...valid] }));
    e.target.value = "";
  };

  const removeNewImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const removeExistingImage = (imgIdx: number) => {
    setForm((f) => ({
      ...f,
      existingImages: f.existingImages.filter((_, i) => i !== imgIdx),
      existingImagePaths: f.existingImagePaths.filter((_, i) => i !== imgIdx),
      existingImageIds: f.existingImageIds.filter((_, i) => i !== imgIdx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const removeImagePath = initial?.existingImagePaths
      ? initial.existingImagePaths.filter((p) => !form.existingImagePaths.includes(p))
      : [];
    const removeImageId = initial?.existingImageIds
      ? initial.existingImageIds.filter((id) => !form.existingImageIds.includes(id))
      : [];

    // Generate slug unik otomatis hanya untuk produk baru (bukan saat edit)
    const isNewProduct = !initial;
    const uniqueSlug = isNewProduct
      ? form.slug
        ? form.slug
        : generateUniqueSlug(form.name || "product")
      : form.slug;
    const formWithUniqueSlug: ProductFormValue = {
      ...form,
      slug: uniqueSlug,
    };

    await onSubmit(formWithUniqueSlug, removeImagePath, removeImageId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {errorMsg && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Nama produk *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => {
              const v = e.target.value;
              setForm((f) => ({ ...f, name: v, slug: initial && initial.name ? f.slug : slugify(v) }));
            }}
            required
            placeholder="Masukkan nama produk"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Slug *</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            required
            placeholder="nama-produk-andal"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <p className="mt-1 text-xs text-slate-500">Otomatis dibuat dari nama, dapat diubah.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Kategori *</label>
          {categories.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada kategori. Tambahkan dulu dari halaman admin.</p>
          ) : (
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">Pilih kategori</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Harga jual *</label>
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => {
              const v = e.target.value;
              setForm((f) => ({
                ...f,
                price: v,
                originalPrice: computeOriginalFromDiscount(v, f.discountPercent),
              }));
            }}
            required
            placeholder="5000000"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Diskon (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={form.discountPercent}
            onChange={(e) => {
              const discount = e.target.value;
              setForm((f) => ({
                ...f,
                discountPercent: discount,
                originalPrice: computeOriginalFromDiscount(f.price, discount),
              }));
            }}
            placeholder="mis. 20"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <p className="mt-1 text-xs text-slate-500">Jika diisi, harga asal otomatis terhitung dan akan dicoret.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Harga asal (otomatis)</label>
          <input
            type="number"
            min={0}
            value={form.originalPrice}
            onChange={(e) => {
              const v = e.target.value;
              setForm((f) => ({
                ...f,
                originalPrice: v,
                discountPercent: computeDiscountPercent(f.price, v),
              }));
            }}
            placeholder={form.price ? "Otomatis dihitung dari diskon" : ""}
            readOnly={!!form.discountPercent}
            className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-6">
          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-slate-700">Stok tersedia</span>
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-slate-700">Produk unggulan</span>
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Jumlah stok</label>
          <input
            type="number"
            min={0}
            value={form.stockQuantity}
            onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
            placeholder="0"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <p className="mt-1 text-xs text-slate-500">Jika 0, produk tidak akan muncul di halaman publik.</p>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Deskripsi singkat</label>
          <input
            type="text"
            value={form.shortDescription}
            onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
            placeholder="Ringkasan singkat produk"
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Deskripsi lengkap *</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
            rows={4}
            placeholder="Deskripsi produk lengkap..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-slate-700">Gambar produk *</label>
          <div className="mt-2 flex flex-wrap gap-3">
            {form.existingImages.map((img, i) => (
              <div key={`existing-${i}`} className="relative h-24 w-24 shrink-0">
                <img src={img} alt={`existing ${i}`} className="h-24 w-24 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(i)}
                  className="absolute right-1 top-1 rounded-full bg-rose-600 p-1 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {form.images.map((file, i) => (
              <div key={`new-${i}`} className="relative h-24 w-24 shrink-0">
                <img src={URL.createObjectURL(file)} alt={`new ${i}`} className="h-24 w-24 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute right-1 top-1 rounded-full bg-rose-600 p-1 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Upload size={16} /> Pilih gambar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="sr-only"
          />
          <p className="mt-1.5 text-xs text-slate-500">PNG, JPG, WEBP. Boleh pilih beberapa.</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : <><Plus size={16} /> Simpan produk</>}
        </button>
      </div>
    </form>
  );
}
