import { useEffect, useState, useCallback } from "react";
import { Package, ShoppingBag, Plus, Edit3, Trash2, X } from "lucide-react";
import { productsApi, categoriesApi, ordersApi, accountsApi } from "@/data/productsApi";
import { ProductForm } from "@/components/ProductForm";
import { buildProductFormInitial } from "@/data/productFormInitial";
import type { ProductFormValue } from "@/components/ProductForm";
import type { Product, Category } from "@/data/products";
import type { Profile } from "@/data/profile";
import type { Tab } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/data/products";

type OrderRow = {
  id: string;
  customer_id: string | null;
  toko_id: string | null;
  total_amount: number;
  status: string;
  shipping_address: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export function TokoPage({ onTabChange }: { onTabChange: (tab: Tab) => void }) {
  const { profile, logout } = useAuth();
  const { count } = useCart();
  const { refetch: refetchProducts } = useProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [couriers, setCouriers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [courierChoice, setCourierChoice] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [prods, cats, ord, couriersData] = await Promise.all([
        productsApi.list(),
        categoriesApi.list(),
        // Urutkan pesanan: yang perlu disetujui dulu, lalu yang sudah disetujui, dst.
        ordersApi.listByToko(profile!.id),
        accountsApi.list(),
      ]);
      let myProducts = prods;
      if (profile?.role === "toko") {
        myProducts = prods.filter((p) => p.createdBy === profile.id);
      }
      // Pesan pertama: diajukan customer, perlu persetujuan toko dulu
      const statusPriority: Record<string, number> = {
        pending_toko_approve: 0,
        assigned_to_courier: 1,
        in_transit: 2,
        delivered: 3,
        cancelled: 4,
        pending_customer_confirm: 5,
      };
      const sorted = (ord ?? []).sort((a, b) => {
        const pa = statusPriority[a.status] ?? 9;
        const pb = statusPriority[b.status] ?? 9;
        if (pa !== pb) return pa - pb;
        return new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime();
      });
      setProducts(myProducts);
      setCategories(cats);
      setOrders(sorted as OrderRow[]);
      setCouriers(couriersData.filter((c: Profile) => c.role === "courier" && c.approved));
    } catch (e) {
      setErrorMsg((e as Error).message);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetchAll = useCallback(() => {
    refetchProducts();
    return fetchData();
  }, [fetchData, refetchProducts]);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (v: ProductFormValue, removePaths: string[], removeIds: string[]) => {
    setSubmitLoading(true);
    setErrorMsg(null);
    try {
      if (editing) {
        await productsApi.update(String(editing.id), {
          name: v.name,
          slug: v.slug,
          description: v.description,
          shortDescription: v.shortDescription,
          price: Number(v.price),
          originalPrice: v.originalPrice ? Number(v.originalPrice) : undefined,
          categoryId: v.categoryId || undefined,
          inStock: v.inStock,
          stockQuantity: v.stockQuantity ? Number(v.stockQuantity) : 0,
          featured: v.featured,
        });
        await productsApi.updateImages(String(editing.id), v.images, removeIds, removePaths);
      } else {
        await productsApi.create({
          name: v.name,
          slug: v.slug,
          description: v.description,
          shortDescription: v.shortDescription,
          price: Number(v.price),
          originalPrice: v.originalPrice ? Number(v.originalPrice) : undefined,
          categoryId: v.categoryId || undefined,
          inStock: v.inStock,
          stockQuantity: v.stockQuantity ? Number(v.stockQuantity) : 0,
          featured: v.featured,
          images: v.images,
          createdBy: profile?.id,
        });
      }
      closeForm();
      refetchAll();
    } catch (e) {
      setErrorMsg((e as Error).message);
    }
    setSubmitLoading(false);
  };

  const deleteProduct = async (p: Product) => {
    if (!window.confirm(`Hapus produk "${p.name}"? Gambar akan dihapus dari storage.`)) return;
    try {
      await productsApi.delete(String(p.id));
      refetchAll();
    } catch (e) {
      setErrorMsg((e as Error).message);
    }
  };

  if (profile?.role !== "toko") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <Package size={48} className="mx-auto text-slate-300" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Akses ditolak</h1>
        <p className="mt-2 text-slate-600">Halaman ini hanya tersedia untuk toko.</p>
        <button
          onClick={() => onTabChange("home")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white"
        >
          Kembali ke beranda
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel Toko</h1>
            <p className="mt-1 text-sm text-slate-500">
              Selamat datang, <strong>{profile?.username}</strong>. Kelola produk Anda.
            </p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Keluar
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Pesanan Masuk ({orders.filter((o) => o.status === "pending_toko_approve").length})</h2>
          {orders.filter((o) => o.status === "pending_toko_approve").length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada pesanan yang perlu disetujui.</p>
          ) : (
            <div className="space-y-3">
              {orders.filter((o) => o.status === "pending_toko_approve").map((o) => (
                <div key={o.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">Order #{o.id.slice(0, 8)}...</p>
                      <p className="text-sm text-slate-600">
                        Total:{" "}
                        <span className="font-medium">
                          {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(o.total_amount))}
                        </span>
                      </p>
                      {o.shipping_address && (
                        <p className="text-xs text-slate-500 mt-1">Kirim ke: {o.shipping_address}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={courierChoice[o.id] ?? ""}
                          onChange={(e) => setCourierChoice({ ...courierChoice, [o.id]: e.target.value })}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none"
                        >
                          <option value="">Pilih kurir</option>
                          {couriers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.username}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={async () => {
                            const courierId = courierChoice[o.id];
                            if (!courierId) {
                              setErrorMsg("Pilih kurir terlebih dahulu.");
                              return;
                            }
                            setAssigningId(o.id);
                            try {
                              await ordersApi.approveOrderWithCourier(o.id, courierId);
                              await fetchData();
                              setCourierChoice((c) => {
                                const n = { ...c };
                                delete n[o.id];
                                return n;
                              });
                            } catch (e) {
                              setErrorMsg((e as Error).message);
                            }
                            setAssigningId(null);
                          }}
                          disabled={assigningId === o.id || !courierChoice[o.id]}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                        >
                          {assigningId === o.id ? "Memproses..." : "Terima & Assign"}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await ordersApi.rejectOrder(o.id);
                              await fetchData();
                            } catch (e) {
                              setErrorMsg((e as Error).message);
                            }
                          }}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Semua Pesanan ({orders.filter((o) => statusFilter === "all" || o.status === statusFilter).length})</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="pending_toko_approve">Menunggu Approval</option>
            <option value="assigned_to_courier">Di-assign ke Kurir</option>
            <option value="in_transit">Dalam Perjalanan</option>
            <option value="delivered">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Memuat...</p>
        ) : orders.filter((o) => statusFilter === "all" || o.status === statusFilter).length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada pesanan.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
               <thead className="border-b border-slate-200 bg-slate-50">
                 <tr>
                   <th className="px-4 py-3 font-semibold text-slate-900">ID</th>
                   <th className="px-4 py-3 font-semibold text-slate-900">Total</th>
                   <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
                   <th className="px-4 py-3 font-semibold text-slate-900">Dibuat</th>
                   <th className="px-4 py-3 text-center font-semibold text-slate-900">Aksi</th>
                 </tr>
               </thead>
                <tbody>
                  {orders.filter((o) => statusFilter === "all" || o.status === statusFilter).map((o) => (
                   <tr key={o.id} className="border-b border-slate-100">
                     <td className="px-4 py-3 text-slate-500">{o.id.slice(0, 8)}...</td>
                     <td className="px-4 py-3 text-slate-900">
                       {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(o.total_amount))}
                     </td>
                     <td className="px-4 py-3">
                       <span className="text-xs text-slate-600">{o.status}</span>
                     </td>
                     <td className="px-4 py-3 text-slate-500">
                       {o.created_at ? new Date(o.created_at).toLocaleDateString("id-ID") : "-"}
                     </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                             {o.status === "pending_toko_approve" && (
                               <span className="text-xs text-slate-500">Pilih kurir di atas</span>
                             )}
                            {o.status === "assigned_to_courier" && (
                             <button
                               onClick={async () => {
                                 try {
                                   await ordersApi.updateStatus(o.id, "in_transit");
                                   await fetchData();
                                 } catch (e) {
                                   setErrorMsg((e as Error).message);
                                 }
                               }}
                               className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-500"
                             >
                               Ambil barang
                             </button>
                           )}
                            {o.status === "in_transit" && (
                             <button
                               onClick={async () => {
                                 try {
                                   await ordersApi.updateStatus(o.id, "delivered");
                                   await fetchData();
                                 } catch (e) {
                                   setErrorMsg((e as Error).message);
                                 }
                               }}
                               className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                             >
                               Selesai
                             </button>
                           )}
                         </div>
                       </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Produk Anda ({products.length})</h2>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500"
        >
          <Plus size={16} /> Tambah produk
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  {editing ? "Edit Produk" : "Tambah Produk Baru"}
                </h3>
                <button
                  onClick={closeForm}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
              <ProductForm
                categories={categories}
                initial={editing ? buildProductFormInitial(editing) : undefined}
                onSubmit={handleSubmit}
                onCancel={closeForm}
                loading={submitLoading}
                errorMsg={errorMsg}
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Memuat produk...</p>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
          <Package size={40} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">Belum ada produk. Tambahkan produk pertama Anda.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-900">Produk</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Kategori</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Harga</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Stok</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Gambar</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-900">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100">
                        {p.images.length > 0 ? (
                          <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <Package size={18} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.shortDescription.slice(0, 40)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.category}</td>
                  <td className="px-4 py-3 text-slate-900">{formatPrice(p.price)}</td>
                   <td className="px-4 py-3">
                     <span className="font-medium text-slate-900">{p.stockQuantity ?? 0}</span>
                     <span className={`ml-2 text-xs ${p.inStock ? "text-emerald-700" : "text-rose-600"}`}>
                       ({p.inStock ? "Aktif" : "Non-aktif"})
                     </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.images.length}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditing(p);
                          setShowForm(true);
                        }}
                        className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => deleteProduct(p)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {count > 0 && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            Anda masih memiliki <strong>{count}</strong> item di keranjang.
            <button
              onClick={() => onTabChange("cart")}
              className="ml-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
            Lihat keranjang
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
