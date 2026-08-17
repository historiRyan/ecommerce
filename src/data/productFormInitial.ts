import type { ProductFormValue } from "@/components/ProductForm";
import type { Product } from "@/data/products";

export function buildProductFormInitial(product?: Product): Partial<ProductFormValue> {
  if (!product) return {};
  return {
    name: product.name,
    slug: product.slug ?? slugify(product.name),
    description: product.description,
    shortDescription: product.shortDescription,
    price: String(product.price),
    originalPrice: product.originalPrice ? String(product.originalPrice) : "",
    categoryId: product.categoryId ?? "",
    inStock: product.inStock,
    featured: product.featured ?? false,
    stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : "",
    existingImages: product.images,
    existingImagePaths: product.imagePaths ?? [],
    existingImageIds: product.imageIds ?? [],
  };
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
