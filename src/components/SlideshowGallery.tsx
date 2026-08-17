import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function SlideshowGallery({
  images,
  alt,
  autoplay = true,
  interval = 4000,
}: {
  images: string[];
  alt: string;
  autoplay?: boolean;
  interval?: number;
}) {
  const [active, setActive] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!autoplay || images.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, interval);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [autoplay, interval, images.length]);

  if (images.length === 0) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-2xl bg-slate-100">
        <span className="text-sm text-slate-400">Tidak ada gambar</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <img src={images[0]} alt={alt} className="aspect-square w-full object-cover" />
      </div>
    );
  }

  const prev = () => setActive((prev) => (prev - 1 + images.length) % images.length);
  const next = () => setActive((prev) => (prev + 1) % images.length);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <div className="relative aspect-square">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`${alt} ${i + 1}`}
            loading={i === active ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-slate-700 shadow-md backdrop-blur hover:bg-white"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-slate-700 shadow-md backdrop-blur hover:bg-white"
      >
        <ChevronRight size={18} />
      </button>

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-1.5 w-6 rounded-full transition-all ${
              i === active ? "w-8 bg-indigo-600" : "bg-slate-300 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
