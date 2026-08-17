import { useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Lock,
  Truck,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ordersApi } from "@/data/productsApi";
import { formatPrice } from "@/data/products";
import type { Tab } from "@/components/Navbar";

export function CartCheckoutPage({ onTabChange }: { onTabChange: (tab: Tab) => void }) {
  const { items, removeItem, updateQuantity, subtotal, clear, count } = useCart();
  const { profile } = useAuth();
  const [placed, setPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    zip: "",
    country: "Indonesia",
    shipping: "standard",
  });

  const shippingCost = subtotal > 24000000 || subtotal === 0 ? 0 : 192000;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + shippingCost + tax;

  const update = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  if (placed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Pesanan dikonfirmasi</h1>
        <p className="mt-3 text-slate-600">
          Terima kasih, {form.firstName || "teman"}. Konfirmasi telah dikirim ke{" "}
          <span className="font-medium text-slate-900">{form.email || "kotak masuk Anda"}</span>.
        </p>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-sm text-slate-500">Nomor pesanan</span>
            <span className="text-sm font-semibold text-slate-900">#LX-{Math.floor(Math.random() * 90000 + 10000)}</span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Total dibayar</span>
            <span className="text-sm font-semibold text-slate-900">{formatPrice(total)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-slate-500">Perkiraan pengiriman</span>
            <span className="text-sm font-semibold text-slate-900">3–5 hari kerja</span>
          </div>
        </div>
        <button
          onClick={() => {
            setPlaced(false);
            clear();
            onTabChange("shop");
          }}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Lanjutkan belanja <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="grid h-16 w-16 mx-auto place-items-center rounded-full bg-slate-100 text-slate-400">
          <ShoppingBag size={32} />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Keranjang belanja Anda kosong</h1>
        <p className="mt-2 text-slate-500">Sepertinya belum ada yang ditambahkan.</p>
        <button
          onClick={() => onTabChange("shop")}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Mulai berbelanja <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Keranjang &amp; checkout
      </h1>
      <p className="mt-1 text-sm text-slate-500">{count} {count === 1 ? "barang" : "barang"} dalam keranjang Anda</p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart list */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {items.map((item, i) => (
              <div
                key={`${item.product.id}-${item.color}-${item.size}`}
                className={`flex gap-4 p-4 sm:p-5 ${i !== 0 ? "border-t border-slate-100" : ""}`}
              >
                <button
                  onClick={() => onTabChange("product")}
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-28 sm:w-28"
                >
                  <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />
                </button>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-indigo-600">
                        {item.product.category}
                      </p>
                      <h3 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                        {item.product.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.color} · {item.size}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                   <div className="mt-auto flex items-end justify-between pt-3">
                     <div className="flex items-center rounded-lg border border-slate-200">
                       <button
                         onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                         disabled={item.quantity <= 1}
                         className="grid h-9 w-9 place-items-center text-slate-600 transition-colors hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                       >
                         <Minus size={14} />
                       </button>
                       <span className="w-9 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                       <button
                         onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                         disabled={(item.product.stockQuantity ?? 0) <= item.quantity}
                         className="grid h-9 w-9 place-items-center text-slate-600 transition-colors hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
                       >
                         <Plus size={14} />
                       </button>
                     </div>
                     <div className="text-right">
                       <p className="text-base font-bold text-slate-900">
                         {formatPrice(item.product.price * item.quantity)}
                       </p>
                       <p className="text-xs text-slate-500">
                         Stok tersedia: {item.product.stockQuantity ?? 0}
                       </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-slate-400">{formatPrice(item.product.price)} each</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onTabChange("shop")}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            <ArrowRight size={15} className="rotate-180" /> Lanjutkan belanja
          </button>
        </div>

        {/* Checkout */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-5">
            {/* Shipping form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Detail pengiriman</h2>
              <div className="mt-4 space-y-3">
                <Field label="Email" value={form.email} onChange={(v) => update("email", v)} type="email" placeholder="kamu@contoh.com" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nama depan" value={form.firstName} onChange={(v) => update("firstName", v)} placeholder="Alex" />
                  <Field label="Nama belakang" value={form.lastName} onChange={(v) => update("lastName", v)} placeholder="Morgan" />
                </div>
                <Field label="Alamat" value={form.address} onChange={(v) => update("address", v)} placeholder="Jl. Pasar No. 123" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Kota" value={form.city} onChange={(v) => update("city", v)} placeholder="Jakarta" />
                  <Field label="Kode pos" value={form.zip} onChange={(v) => update("zip", v)} placeholder="12340" />
                </div>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-slate-500">Metode pengiriman</p>
                <div className="space-y-2">
                   {[
                    { id: "standard", label: "Standar (3–5 hari)", price: shippingCost === 0 ? "Gratis" : formatPrice(192000) },
                    { id: "express", label: "Ekspres (1–2 hari)", price: formatPrice(384000) },
                   ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                        form.shipping === opt.id ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`grid h-4 w-4 place-items-center rounded-full border-2 ${form.shipping === opt.id ? "border-indigo-600" : "border-slate-300"}`}>
                          {form.shipping === opt.id && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
                        </span>
                        <span className="text-slate-700">{opt.label}</span>
                      </span>
                      <span className="font-medium text-slate-900">{opt.price}</span>
                      <input
                        type="radio"
                        name="shipping"
                        checked={form.shipping === opt.id}
                        onChange={() => update("shipping", opt.id)}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">Ringkasan pesanan</h2>
              <div className="mt-4 space-y-2.5 text-sm">
                <Row label="Subtotal" value={formatPrice(subtotal)} />
                <Row label="Pengiriman" value={shippingCost === 0 ? "Gratis" : formatPrice(shippingCost)} />
                <Row label="Pajak (8%)" value={formatPrice(tax)} />
                <div className="my-3 h-px bg-slate-100" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">Total</span>
                   <span className="text-base font-bold text-slate-900">{formatPrice(total)}</span>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!profile) {
                    onTabChange("login");
                    return;
                  }
                  setPlaceError(null);
                  const zeroStock = items.find((item) => (item.product.stockQuantity ?? 0) === 0);
                  if (zeroStock) {
                    setPlaceError(`Produk "${zeroStock.product.name}" sedang habis.`);
                    return;
                  }
                  const insufficient = items.find(
                    (item) => (item.product.stockQuantity ?? 0) < item.quantity
                  );
                  if (insufficient) {
                    setPlaceError(
                      `Stok "${insufficient.product.name}" tidak mencukupi. Tersedia: ${insufficient.product.stockQuantity ?? 0}, diminta: ${insufficient.quantity}. Kurangi quantity dulu.`
                    );
                    return;
                  }

                  setPlacing(true);
                  try {
                    const itemsInput = items.map((item) => {
                      const pid = String(item.product.id);
                      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pid);
                      return {
                        productId: isUuid ? pid : null,
                        quantity: item.quantity,
                        price: item.product.price,
                        createdBy: item.product.createdBy ?? null,
                      };
                    });
                    await ordersApi.create({
                      customerId: profile.id,
                      tokoId: (items.find((i) => i.product.createdBy)?.product.createdBy) ?? undefined,
                      totalAmount: total,
                      shippingAddress: `${form.firstName} ${form.lastName}, ${form.address}, ${form.city} ${form.zip}`,
                      notes: `Shipping: ${form.shipping}`,
                      items: itemsInput,
                    });
                    setPlaced(true);
                    clear();
                  } catch (e) {
                  setPlaceError((e as Error).message);
                   }
                   setPlacing(false);
                 }}
                 disabled={placing}
                 className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-60"
               >
                 <Lock size={16} /> {placing ? "Memproses..." : "Tempatkan pesanan"}
               </button>
               {items.filter((i) => (i.product.stockQuantity ?? 0) < i.quantity).length > 0 && (
                 <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                   <strong>Peringatan stok:</strong>
                   <ul className="mt-1 list-disc list-inside">
                     {items
                       .filter((i) => (i.product.stockQuantity ?? 0) < i.quantity)
                       .map((i) => (
                         <li key={i.product.id}>
                           "{i.product.name}" — tersedia {(i.product.stockQuantity ?? 0)}, diminta {i.quantity}
                         </li>
                       ))}
                   </ul>
                 </div>
               )}
               {items.some((i) => (i.product.stockQuantity ?? 0) === 0) && (
                 <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                   <strong>Produk habis:</strong>{" "}
                   {items
                     .filter((i) => (i.product.stockQuantity ?? 0) === 0)
                     .map((i) => i.product.name)
                     .join(", ")}
                 </div>
               )}
               {placeError && (
                 <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                   {placeError}
                </div>
              )}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><CreditCard size={14} /> Checkout aman</span>
                <span className="flex items-center gap-1"><Truck size={14} /> Pengiriman dilacak</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
