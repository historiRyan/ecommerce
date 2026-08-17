import { useEffect, useState } from "react";
import { Shield, User, Search, Trash2, Plus, Edit3, Package, Tag, X, Save, Clock, CheckCircle2, Truck } from "lucide-react";
import { productsApi, categoriesApi, accountsApi } from "@/data/productsApi";
import { ProductForm } from "@/components/ProductForm";
import { buildProductFormInitial } from "@/data/productFormInitial";
import type { ProductFormValue } from "@/components/ProductForm";
import type { Product, Category } from "@/data/products";
import type { Profile, Role } from "@/data/profile";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductsContext";
import type { Tab } from "@/components/Navbar";
import { formatPrice } from "@/data/products";

const roleLabel: Record<Role, string> = {
  admin: "Admin",
  toko: "Toko",
  courier: "Kurir",
  customer: "Customer",
};

type AdminSection = "users" | "products" | "categories" | "pending_toko" | "pending_courier";

export function AdminPage({ onTabChange }: { onTabChange: (tab: Tab) => void }) {
  const { profile, logout } = useAuth();
  const [section, setSection] = useState<AdminSection>("users");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [productsList, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pendingToko, setPendingToko] = useState<Profile[]>([]);
  const { refetch: refetchProducts } = useProducts();

  const [pendingCourier, setPendingCourier] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [profs, prods, cats, pendingTokoData, pendingCourierData] = await Promise.all([
          accountsApi.list(),
          productsApi.list(),
          categoriesApi.list(),
          accountsApi.listPendingToko(),
          accountsApi.listPendingCourier(),
        ]);
        setProfiles(profs);
        setProducts(prods);
        setCategories(cats);
        setPendingToko(pendingTokoData ?? []);
        setPendingCourier(pendingCourierData ?? []);
      } catch (e) {
        setErrorMsg((e as Error).message);
      }
      setLoading(false);
    };

   const reload = () => {
     refetchProducts();
     return fetchData();
   };

  if (profile?.role !== "admin") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <Shield size={48} className="mx-auto text-slate-300" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Akses ditolak</h1>
        <p className="mt-2 text-slate-600">Halaman ini hanya tersedia untuk admin.</p>
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
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel Admin</h1>
            <p className="mt-1 text-sm text-slate-500">Kelola pengguna, produk, dan kategori.</p>
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

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSection("users")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            section === "users" ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <User size={16} className="inline mr-1.5" />Akun Pengguna
        </button>
        <button
          onClick={() => setSection("products")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            section === "products" ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Package size={16} className="inline mr-1.5" />Produk
        </button>
        <button
          onClick={() => setSection("categories")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            section === "categories" ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Tag size={16} className="inline mr-1.5" />Kategori
        </button>
        <button
          onClick={() => setSection("pending_toko")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            section === "pending_toko" ? "bg-amber-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Clock size={16} className="inline mr-1.5" />Persetujuan Toko ({pendingToko.length})
        </button>
        <button
          onClick={() => setSection("pending_courier")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            section === "pending_courier" ? "bg-purple-600 text-white" : "border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Truck size={16} className="inline mr-1.5" />Persetujuan Kurir ({pendingCourier.length})
        </button>
      </div>

      {section === "users" && (
        <UsersSection
          profiles={profiles}
          loading={loading}
          search={search}
          setSearch={setSearch}
          savingId={savingId}
          updateRole={async (id, role) => {
            setSavingId(id);
            try {
              await accountsApi.updateRole(id, role);
              setProfiles(profiles.map((p) => (p.id === id ? { ...p, role } : p)));
            } catch (e) {
              setErrorMsg((e as Error).message);
            }
            setSavingId(null);
          }}
          deleteProfile={async (id) => {
            if (!window.confirm("Yakin ingin menghapus profil ini?")) return;
            try {
              await accountsApi.delete(id);
              setProfiles(profiles.filter((p) => p.id !== id));
            } catch (e) {
              setErrorMsg((e as Error).message);
            }
          }}
          createAccount={async (username, password, role) => {
            try {
              await accountsApi.create(username, password, role);
              reload();
            } catch (e) {
              setErrorMsg((e as Error).message);
            }
          }}
        />
      )}

      {section === "products" && (
        <ProductsSection
          products={productsList}
          categories={categories}
          loading={loading}
          onRefetch={reload}
          onError={setErrorMsg}
        />
      )}

      {section === "categories" && (
        <CategoriesSection
          categories={categories}
          loading={loading}
          onRefetch={reload}
          onError={setErrorMsg}
          errorMsg={errorMsg}
        />
      )}

      {section === "pending_toko" && (
        <PendingTokoSection
          pending={pendingToko}
          loading={loading}
          onApprove={async (id) => {
            await accountsApi.approveToko(id);
            setPendingToko(pendingToko.filter((p) => p.id !== id));
          }}
          onReject={async (id) => {
            await accountsApi.rejectToko(id);
            setPendingToko(pendingToko.filter((p) => p.id !== id));
          }}
        />
      )}

      {section === "pending_courier" && (
        <PendingTokoSection
          pending={pendingCourier}
          loading={loading}
          roleLabel="Kurir"
          onApprove={async (id) => {
            await accountsApi.approveCourier(id);
            setPendingCourier(pendingCourier.filter((p) => p.id !== id));
          }}
          onReject={async (id) => {
            await accountsApi.rejectCourier(id);
            setPendingCourier(pendingCourier.filter((p) => p.id !== id));
          }}
        />
      )}
    </div>
  );
}

function UsersSection({
  profiles,
  loading,
  search,
  setSearch,
  savingId,
  updateRole,
  deleteProfile,
  createAccount,
}: {
  profiles: Profile[];
  loading: boolean;
  search: string;
  setSearch: (s: string) => void;
  savingId: string | null;
  updateRole: (id: string, role: Role) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  createAccount: (username: string, password: string, role: Role) => Promise<void>;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "toko" as Role });

  const handleCreate = async () => {
    if (!newUser.username || !newUser.password) return;
    await createAccount(newUser.username, newUser.password, newUser.role);
    setNewUser({ username: "", password: "", role: "toko" });
    setShowCreate(false);
  };

  const filtered = profiles.filter(
    (p) =>
      p.username.toLowerCase().includes(search.toLowerCase()) ||
      p.id.includes(search)
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Akun Pengguna ({filtered.length})</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <Plus size={16} /> Tambah akun
        </button>
      </div>

      {showCreate && (
        <div className="mb-4 rounded-xl border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Buat akun baru</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Kata sandi"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none"
            >
              <option value="toko">Toko</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
            </select>
            <button
              onClick={handleCreate}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              <Save size={16} /> Simpan
            </button>
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <Search size={16} className="text-slate-400" />
        <input
          type="text"
          placeholder="Cari nama pengguna..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Memuat...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">Tidak ada pengguna ditemukan.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-900">Nama</th>
                <th className="px-4 py-3 font-semibold text-slate-900">ID</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Role</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Dibuat</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-900">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-slate-400" />
                      <span className="font-medium text-slate-900">{p.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3">
                    {savingId === p.id ? (
                      <span className="text-xs text-slate-500">Menyimpan...</span>
                    ) : (
                      <select
                        value={p.role}
                        onChange={(e) => updateRole(p.id, e.target.value as Role)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
                      >
                        {(["admin", "toko", "courier", "customer"] as Role[]).map((r) => (
                          <option key={r} value={r}>
                            {roleLabel[r]}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.approved
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {p.approved ? "Disetujui" : "Menunggu"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString("id-ID") : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => deleteProfile(p.id)}
                      className="inline-flex items-center justify-center rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
                      title="Hapus profil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductsSection({
  products: list,
  categories,
  loading,
  onRefetch,
  onError,
}: {
  products: Product[];
  categories: Category[];
  loading: boolean;
  onRefetch: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const startCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const startEdit = (p: Product) => {
    setEditing(p);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (v: ProductFormValue, removePaths: string[], removeIds: string[]) => {
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
          featured: v.featured,
        });
        await productsApi.updateImages(
          String(editing.id),
          v.images,
          removeIds,
          removePaths
        );
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
          featured: v.featured,
          images: v.images,
        });
      }
      closeForm();
      onRefetch();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  const deleteProduct = async (p: Product) => {
    if (!window.confirm(`Hapus produk "${p.name}"? Gambar akan dihapus dari storage.`)) return;
    try {
      await productsApi.delete(String(p.id));
      onRefetch();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Produk ({list.length})</h2>
        <button
          onClick={startCreate}
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
                loading={false}
                errorMsg={null}
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Memuat produk...</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-slate-500">Belum ada produk.</p>
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
              {list.map((p) => (
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
                    <span className={`text-xs font-medium ${p.inStock ? "text-emerald-700" : "text-rose-600"}`}>
                      {p.inStock ? "Tersedia" : "Habis"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.images.length}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => startEdit(p)}
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
    </div>
  );
}

function PendingTokoSection({
  pending,
  loading,
  onApprove,
  onReject,
  roleLabel = "Toko",
}: {
  pending: Profile[];
  loading: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  roleLabel?: string;
}) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setActionId(id);
    setErrorMsg(null);
    try {
      await onApprove(id);
    } catch (e) {
      setErrorMsg((e as Error).message);
    }
    setActionId(null);
  };

  const handleReject = async (id: string) => {
    if (!window.confirm(`Tolak pendaftaran ${roleLabel.toLowerCase()} ini? Akun akan dihapus permanen.`)) return;
    setActionId(id);
    setErrorMsg(null);
    try {
      await onReject(id);
    } catch (e) {
      setErrorMsg((e as Error).message);
    }
    setActionId(null);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        Persetujuan Akun {roleLabel} ({pending.length})
      </h2>
      {errorMsg && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}
      {loading ? (
        <p className="text-sm text-slate-500">Memuat...</p>
      ) : pending.length === 0 ? (
        <p className="text-sm text-slate-500">Tidak ada pendaftar toko yang menunggu persetujuan.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-900">Username</th>
                <th className="px-4 py-3 font-semibold text-slate-900">ID</th>
                <th className="px-4 py-3 font-semibold text-slate-900">Didaftar</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-900">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-slate-400" />
                      <span className="font-medium text-slate-900">{p.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString("id-ID") : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleApprove(p.id)}
                        disabled={actionId === p.id}
                        className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-60"
                        title="Setujui"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        onClick={() => handleReject(p.id)}
                        disabled={actionId === p.id}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                        title="Tolak"
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
    </div>
  );
}

function CategoriesSection({
  categories: list,
  loading,
  onRefetch,
  onError,
  errorMsg,
}: {
  categories: Category[];
  loading: boolean;
  onRefetch: () => Promise<void>;
  onError: (msg: string) => void;
  errorMsg: string | null;
}) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const addCategory = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await categoriesApi.create(newName.trim());
      await onRefetch();
      setNewName("");
    } catch (e) {
      onError((e as Error).message);
    }
    setCreating(false);
  };

  const deleteCategory = async (c: Category) => {
    if (!window.confirm(`Hapus kategori "${c.name}"?`)) return;
    try {
      await categoriesApi.delete(c.id);
      onRefetch();
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Kategori ({list.length})</h2>
      {errorMsg && <p className="mb-3 text-sm text-rose-700">{errorMsg}</p>}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nama kategori baru"
          className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <button
          onClick={addCategory}
          disabled={creating || !newName.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {creating ? "Menambah..." : <><Plus size={16} /> Tambah</>}
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Memuat...</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-slate-500">Belum ada kategori.</p>
      ) : (
        <div className="space-y-2">
          {list.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5">
              <div>
                <p className="font-medium text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">/{c.slug}</p>
              </div>
              <button
                onClick={() => deleteCategory(c)}
                className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
