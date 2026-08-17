import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { productsApi, categoriesApi } from "@/data/productsApi";
import type { Product, Category } from "@/data/products";
import { products as sampleProducts, categories as sampleCategories } from "@/data/products";

type ProductsContextValue = {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  featuredProducts: Product[];
  bestSellers: Product[];
  getProductBySlug: (slug: string) => Promise<Product | null>;
  getProductById: (id: string | number) => Product | undefined;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prods, cats] = await Promise.all([productsApi.list(), categoriesApi.list()]);

      const mergedCategories: Category[] = [...sampleCategories];
      for (const c of cats) {
        if (!mergedCategories.find((m) => m.slug === c.slug)) mergedCategories.push({ ...c, count: 0 });
      }

      const mergedProducts: Product[] = [...sampleProducts, ...prods];

      setProducts(mergedProducts);
      setCategories(
        mergedCategories.map((c) => ({
          ...c,
          count: mergedProducts.filter((p) => p.category === c.name).length,
        }))
      );
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getProductBySlug = useCallback(
    async (slug: string): Promise<Product | null> => {
      const local = products.find((p) => (p.slug ?? "") === slug);
      if (local) return local;
      try {
        return await productsApi.getBySlug(slug);
      } catch (e) {
        setError((e as Error).message);
        return null;
      }
    },
    [products]
  );

  const getProductById = useCallback(
    (id: string | number) => products.find((p) => String(p.id) === String(id)),
    [products]
  );

  const featuredProducts = useMemo(() => products.filter((p) => p.featured).slice(0, 8), [products]);
  const bestSellers = useMemo(
    () => [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8),
    [products]
  );

  return (
    <ProductsContext.Provider
      value={{
        products,
        categories,
        loading,
        error,
        refetch: load,
        featuredProducts,
        bestSellers,
        getProductBySlug,
        getProductById,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
