import { useState, useEffect } from "react";
import { Star, Edit3, Trash2, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { reviewsApi } from "@/data/productsApi";
import { getAvatarOrDefaultUrl } from "@/lib/supabase";
import type { ReviewRow, ReviewWithProfileRow } from "@/data/productsApi";
import type { Product } from "@/data/products";
import type { Tab } from "@/components/Navbar";

type DisplayReview = {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  avatar: string;
};

const toDisplay = (r: ReviewWithProfileRow): DisplayReview => ({
  id: r.id,
  author: r.full_name ?? r.username,
  rating: r.rating,
  date: r.created_at ? new Date(r.created_at).toLocaleDateString("id-ID") : "",
  title: r.title ?? "",
  body: r.body ?? "",
  avatar: getAvatarOrDefaultUrl(r.avatar_path ?? null),
});

export function ProductReview({
  product,
  orderId,
  onTabChange,
}: {
  product: Product;
  orderId?: string;
  onTabChange?: (tab: Tab) => void;
}) {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<DisplayReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [myReview, setMyReview] = useState<ReviewRow | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const productId = String(product.id);

  useEffect(() => {
    if (!productId || !profile) {
      setCanReview(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [list, owned, bought] = await Promise.all([
          reviewsApi.listByProduct(productId, orderId),
          reviewsApi.myReview(productId, profile.id, orderId),
          orderId
            ? reviewsApi.hasBoughtInOrder(profile.id, orderId)
            : reviewsApi.hasBoughtProduct(productId, profile.id),
        ]);
        if (cancelled) return;
        setReviews(list.map(toDisplay));
        setMyReview(owned);
        setCanReview(bought);
        if (owned) {
          setRating(owned.rating);
          setTitle(owned.title ?? "");
          setBody(owned.body ?? "");
        }
      } catch (e) {
        if (!cancelled) setErrorMsg((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [productId, profile, orderId]);

  const refreshList = async () => {
    try {
      const list = await reviewsApi.listByProduct(productId, orderId);
      setReviews(list.map(toDisplay));
    } catch (e) {
      setErrorMsg((e as Error).message);
    }
  };

  const handleSubmit = async () => {
    if (!profile || rating < 1 || !orderId) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      if (myReview) {
        await reviewsApi.update(myReview.id, { rating, title, body });
      } else {
        const created = await reviewsApi.create({
          productId,
          orderId,
          customerId: profile.id,
          rating,
          title,
          body,
        });
        setMyReview(created);
      }
      await refreshList();
      setShowForm(false);
    } catch (e) {
      setErrorMsg((e as Error).message);
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!myReview || !window.confirm("Hapus ulasan ini?")) return;
    try {
      await reviewsApi.remove(myReview.id);
      setMyReview(null);
      setRating(0);
      setTitle("");
      setBody("");
      await refreshList();
    } catch (e) {
      setErrorMsg((e as Error).message);
    }
  };

  const StarInput = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hoverRating || rating) >= star;
        return (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-xl"
          >
            <Star
              size={20}
              className={filled ? "fill-amber-400 text-amber-400" : "text-slate-300"}
            />
          </button>
        );
      })}
    </div>
  );

  const ReviewItem = ({ r }: { r: DisplayReview }) => (
    <div className="flex gap-3">
      {r.avatar ? (
        <img src={r.avatar} alt={r.author} className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-400">
          <User size={16} />
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{r.author}</p>
          <StarRating value={r.rating} size={13} />
          <span className="text-xs text-slate-400">{r.date}</span>
        </div>
        {r.title && <p className="mt-0.5 text-sm font-medium text-slate-800">{r.title}</p>}
        {r.body && <p className="text-sm text-slate-600">{r.body}</p>}
      </div>
    </div>
  );

  return (
    <section className="mt-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Ulasan pelanggan</h2>
          {profile && canReview && !myReview && orderId && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500"
            >
              <Star size={16} />
              Beri ulasan
            </button>
          )}
        </div>

        {profile && canReview && !myReview && !orderId && (
          <p className="mb-4 text-xs text-slate-500">
            Beri ulasan untuk produk ini dari halaman{" "}
            <span
              className="font-medium text-indigo-600 underline"
              onClick={() => onTabChange?.("my-orders")}
            >
              Pesanan Saya
            </span>
            .
          </p>
        )}

      {errorMsg && (
        <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            {myReview ? "Edit ulasan" : "Ulas produk ini"}
          </h3>
          <StarInput />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul ulasan (opsional)"
            className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Cerita pengalaman Anda dengan produk ini..."
            rows={3}
            className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || rating < 1}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 disabled:opacity-60"
            >
              {submitting ? "Menyimpan..." : <><Save size={16} /> Simpan</>}
            </button>
          </div>
        </div>
      )}

      {myReview && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-900">Ulasan Anda</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg p-1 text-slate-600 hover:bg-slate-100"
                title="Edit"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg p-1 text-rose-600 hover:bg-rose-50"
                title="Hapus"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <StarRating value={myReview.rating} size={14} />
          {myReview.title && <p className="mt-1 text-sm font-medium text-slate-800">{myReview.title}</p>}
          {myReview.body && <p className="text-sm text-slate-600">{myReview.body}</p>}
          <p className="mt-1 text-xs text-slate-400">
            {myReview.created_at ? new Date(myReview.created_at).toLocaleDateString("id-ID") : ""}
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Memuat ulasan...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-slate-500">
          {profile && canReview
            ? "Jadilah ulasan pertama untuk produk ini."
            : "Belum ada ulasan untuk produk ini."}
        </p>
      ) : (
        <div className="space-y-5">
          {reviews.map((r) => (
            <ReviewItem key={r.id} r={r} />
          ))}
        </div>
      )}
    </section>
  );
}

function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        return (
          <Star
            key={star}
            size={size}
            className={filled ? "fill-amber-400 text-amber-400" : "text-slate-300"}
          />
        );
      })}
    </div>
  );
}

function User({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
