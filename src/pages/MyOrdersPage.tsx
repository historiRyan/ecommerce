import { useEffect, useState, useCallback } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  ChevronDown,
  Star,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ordersApi, type OrderItemRow, reviewsApi } from "@/data/productsApi";
import { formatPrice } from "@/data/products";
import type { Tab } from "@/components/Navbar";
import type { OrderStatus } from "@/data/supabase-types";
import type { ReviewRow } from "@/data/productsApi";

type OrderRow = {
  id: string;
  customer_id: string | null;
  toko_id: string | null;
  total_amount: number;
  status: OrderStatus;
  shipping_address: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type OrderWithItems = OrderRow & { items: OrderItemRow[] };

const statusSteps: { key: OrderStatus; label: string; icon: React.ElementType }[] = [
  { key: "pending_customer_confirm", label: "Menunggu Konfirmasi", icon: Clock },
  { key: "pending_toko_approve", label: "Diproses", icon: Package },
  { key: "assigned_to_courier", label: "Dikirim", icon: Truck },
  { key: "delivered", label: "Selesai", icon: CheckCircle2 },
];

const statusMeta: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending_customer_confirm: { label: "Menunggu Konfirmasi", color: "bg-amber-100 text-amber-800", icon: Clock },
  pending_toko_approve: { label: "Diproses", color: "bg-blue-100 text-blue-800", icon: Package },
  assigned_to_courier: { label: "Dikirim", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  in_transit: { label: "Dalam Perjalanan", color: "bg-purple-100 text-purple-800", icon: Truck },
  delivered: { label: "Selesai", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
  cancelled: { label: "Dibatalkan", color: "bg-rose-100 text-rose-800", icon: XCircle },
};

export function MyOrdersPage({ onTabChange }: { onTabChange: (tab: Tab) => void }) {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const ord = await ordersApi.listByCustomer(profile.id);
      const withItems: OrderWithItems[] = await Promise.all(
        (ord ?? []).map(async (o) => {
          try {
            const items = await ordersApi.getItems(o.id);
            return { ...o, items: items ?? [] };
          } catch {
            return { ...o, items: [] };
          }
        })
      );
      setOrders(withItems);
    } catch (e) {
      setErrorMsg((e as Error).message);
    }
    setLoading(false);
  }, [profile]);

  const handleConfirm = async (order: OrderRow) => {
    if (order.status !== "pending_customer_confirm") return;
    setActionLoading((prev) => ({ ...prev, [order.id]: "confirm" }));
    setErrorMsg(null);
    try {
      await ordersApi.confirmOrder(order.id);
      await fetchOrders();
    } catch (e) {
      setErrorMsg((e as Error).message);
    }
    setActionLoading((prev) => {
      const n = { ...prev };
      delete n[order.id];
      return n;
    });
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const currentStepIndex = (status: OrderStatus) =>
    Math.max(0, statusSteps.findIndex((s) => s.key === status));

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500">Memuat pesanan Anda…</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-slate-100 text-slate-400">
          <Package size={36} />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Belum ada pesanan</h1>
        <p className="mt-2 text-slate-500">Anda belum pernah melakukan pemesanan.</p>
        <button
          onClick={() => onTabChange("shop")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          <ChevronRight size={16} className="rotate-180" />
          Mulai belanja
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Pesanan Saya
        </h1>
        <button
          onClick={fetchOrders}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Refresh
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      <div className="space-y-6">
        {orders.map((o) => {
          const steps = currentStepIndex(o.status);
          const meta = statusMeta[o.status] ?? statusMeta.pending_customer_confirm;
          const Icon = meta.icon;
          const isOpen = expandedOrderId === o.id;
          const subtotal = (o.items ?? []).reduce((sum, it) => sum + Number(it.price) * it.quantity, 0);
          const totalAmount = Number(o.total_amount);
          const shippingFee = Math.max(0, totalAmount - subtotal);
          return (
            <div
              key={o.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs text-slate-500">
                    #{o.id.slice(0, 8)}...
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}
                  >
                    <Icon size={13} />
                    {meta.label}
                  </span>
                </div>
                <p className="mt-0 text-xs text-slate-500">
                  {o.created_at
                    ? new Date(o.created_at).toLocaleDateString("id-ID", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </p>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">
                    {formatPrice(totalAmount)}
                  </p>
                  {o.status === "pending_customer_confirm" && (
                    <button
                      onClick={() => handleConfirm(o)}
                      disabled={actionLoading[o.id] === "confirm"}
                      className="mt-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                    >
                      {actionLoading[o.id] === "confirm" ? "Mengirim..." : "Konfirmasi Pembayaran"}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setExpandedOrderId(isOpen ? null : o.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                  title={isOpen ? "Lebih sedikit" : "Rincian"}
                >
                  <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              <div
                className={`grid transition-all duration-300 ${
                  isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                }`}
              >
                <div className="border-t border-slate-200 px-5 py-4 space-y-4">
                  <div className="flow-root">
                    <ul className="-my-2 divide-y divide-slate-100">
                      {(o.items ?? []).map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-sm text-slate-700">
                            {it.product_id
                              ? `Produk #${it.product_id.slice(0, 6)}`
                              : "Produk sampel"}
                            <span className="mx-1.5 text-slate-300">×</span>
                            <span className="font-medium">{it.quantity}</span>
                          </span>
                          <span className="text-sm text-slate-600">
                            {formatPrice(Number(it.price) * it.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-dashed border-slate-200 pt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal produk</span>
                      <span className="text-slate-900">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ongkir / Biaya lain</span>
                      <span className="text-slate-900">{formatPrice(shippingFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-700">Total</span>
                      <span className="text-slate-900">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>

                  {o.shipping_address && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Kirim ke:</span> {o.shipping_address}
                    </p>
                  )}

                  {o.status === "delivered" && profile && (
                    <ReviewList order={o} profile={profile} />
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 px-5 py-4">
                <div className="relative flex items-center justify-between">
                  {statusSteps.map((step, idx) => {
                    const done = idx <= steps - 1;
                    const active = idx === steps;
                    const StepIcon = step.icon;
                    const ring =
                      active
                        ? "ring-2 ring-indigo-300"
                        : done
                        ? "ring-2 ring-indigo-100"
                        : "";
                    return (
                      <div key={step.key} className="flex flex-col items-center text-center">
                        <div
                          className={`relative z-10 grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${
                            done || active
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-200 text-slate-500"
                          } ${ring}`}
                        >
                          <StepIcon size={14} />
                        </div>
                        <span
                          className={`mt-1.5 block text-xs ${
                            done || active
                              ? "font-semibold text-indigo-700"
                              : "text-slate-500"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                  <div
                    className="absolute top-4 -z-10 h-0.5 w-full"
                    style={{
                      background: `linear-gradient(to right, #4f46e5 0% ${Math.round(
                        (steps / (statusSteps.length - 1)) * 100
                      )}%, #e2e8f0 0% 100%)`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ReviewListProps = {
  order: OrderWithItems;
  profile: { id: string };
};

type ItemReviewState = {
  rating: number;
  hoverRating: number;
  title: string;
  body: string;
  submitting: boolean;
  error: string | null;
};

function ReviewList({ order, profile }: ReviewListProps) {
  const [reviewsByProduct, setReviewsByProduct] = useState<Record<string, ReviewRow | null>>({});
  const [localStates, setLocalStates] = useState<Record<string, ItemReviewState>>({});
  const [loading, setLoading] = useState(true);
  const [submittingAny, setSubmittingAny] = useState(false);

  const loadMyReviews = async () => {
    setLoading(true);
    try {
      const result: Record<string, ReviewRow | null> = {};
      const states: Record<string, ItemReviewState> = {};
      for (const it of order.items ?? []) {
        if (it.product_id) {
          const owned = await reviewsApi.myReview(it.product_id, profile.id, order.id);
          result[it.product_id] = owned;
          states[it.product_id] = {
            rating: owned ? owned.rating : 0,
            hoverRating: 0,
            title: owned ? (owned.title ?? "") : "",
            body: owned ? (owned.body ?? "") : "",
            submitting: false,
            error: null,
          };
        }
      }
      setReviewsByProduct(result);
      setLocalStates(states);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  const setRating = (productId: string, value: number) =>
    setLocalStates((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], rating: value },
    }));

  const setHoverRating = (productId: string, value: number) =>
    setLocalStates((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], hoverRating: value },
    }));

  const setTitle = (productId: string, value: string) =>
    setLocalStates((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], title: value },
    }));

  const setBody = (productId: string, value: string) =>
    setLocalStates((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], body: value },
    }));

  const handleSubmit = async (productId: string) => {
    const state = localStates[productId];
    const owned = reviewsByProduct[productId];
    if (!state || state.rating < 1) return;

    setSubmittingAny(true);
    setLocalStates((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], submitting: true, error: null },
    }));

    try {
      if (owned) {
        await reviewsApi.update(owned.id, {
          rating: state.rating,
          title: state.title || undefined,
          body: state.body || undefined,
        });
      } else {
        const created = await reviewsApi.create({
          productId,
          orderId: order.id,
          customerId: profile.id,
          rating: state.rating,
          title: state.title || undefined,
          body: state.body || undefined,
        });
        setReviewsByProduct((prev) => ({ ...prev, [productId]: created }));
      }
      setLocalStates((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], submitting: false },
      }));
    } catch (e) {
      setLocalStates((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], submitting: false, error: (e as Error).message },
      }));
    }
  };

  if (loading) {
    return <p className="text-xs text-slate-500">Memuat status ulasan…</p>;
  }

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-700 mb-2">Ulas produk pada pesanan ini:</p>
      <div className="flex flex-col gap-3">
        {(order.items ?? []).map((it) => {
          if (!it.product_id) return null;
          const productId = it.product_id;
          const state = localStates[productId];
          const owned = reviewsByProduct[productId];
          if (!state) return null;
          return (
            <div key={productId} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs text-slate-700">
                  Produk #{productId.slice(0, 6)}… × {it.quantity}
                </p>
                {owned && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                    <Star size={12} className="fill-amber-400 text-amber-400" /> Sudah diulas
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = (state.hoverRating || state.rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(productId, star)}
                      onMouseEnter={() => setHoverRating(productId, star)}
                      onMouseLeave={() => setHoverRating(productId, 0)}
                      className="text-xl"
                    >
                      <Star
                        size={16}
                        className={filled ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                      />
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={state.title}
                onChange={(e) => setTitle(productId, e.target.value)}
                placeholder="Judul ulasan (opsional)"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none"
              />
              <textarea
                value={state.body}
                onChange={(e) => setBody(productId, e.target.value)}
                placeholder="Cerita pengalaman Anda..."
                rows={2}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none"
              />
              {state.error && (
                <p className="mt-1 text-xs text-rose-600">{state.error}</p>
              )}
              <div className="mt-2 flex justify-end gap-2">
                {owned && (
                  <button
                    onClick={() => {
                      if (!window.confirm("Hapus ulasan ini?")) return;
                      reviewsApi
                        .remove(owned.id)
                        .then(() => {
                          setReviewsByProduct((prev) => ({ ...prev, [productId]: null }));
                          setLocalStates((prev) => ({
                            ...prev,
                            [productId]: { ...prev[productId], rating: 0, title: "", body: "" },
                          }));
                        })
                        .catch((e) => {
                          setLocalStates((prev) => ({
                            ...prev,
                            [productId]: { ...prev[productId], error: (e as Error).message },
                          }));
                        });
                    }}
                    className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-500"
                  >
                    Hapus
                  </button>
                )}
                <button
                  onClick={() => handleSubmit(productId)}
                  disabled={submittingAny || state.submitting || state.rating < 1}
                  className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {state.submitting ? "Menyimpan..." : owned ? "Update" : "Simpan"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
