import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/data/supabase-types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export const PRODUCTS_BUCKET = "products";
export const AVATARS_BUCKET = "avatars";
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export async function uploadProductImage(file: File, productId: string): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PRODUCTS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    console.error("Upload image error:", error.message, error);
    return null;
  }
  return path;
}

export async function deleteProductImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(PRODUCTS_BUCKET).remove([path]);
  if (error) console.warn("Delete image warning:", error.message);
}

export function getProductPublicUrl(path: string): string {
  const { data } = supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatarImage(file: File, profileId: string): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${profileId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(AVATARS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    console.error("Upload avatar error:", error.message);
    return null;
  }
  return path;
}

export async function deleteAvatarImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(AVATARS_BUCKET).remove([path]);
  if (error) console.warn("Delete avatar warning:", error.message);
}

export function getAvatarPublicUrl(path: string): string {
  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function getAvatarOrDefaultUrl(path: string | null | undefined): string {
  if (!path) return "";
  return getAvatarPublicUrl(path);
}

export async function ensureAvatarsBucket(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.warn("Could not list buckets:", error.message);
      return false;
    }
    return data.some((b) => b.id === AVATARS_BUCKET);
  } catch (e) {
    console.warn("Bucket check failed:", (e as Error).message);
    return false;
  }
}

export async function ensureProductsBucket(): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.warn("Could not list buckets:", error.message);
      return false;
    }
    return data.some((b) => b.id === PRODUCTS_BUCKET);
  } catch (e) {
    console.warn("Bucket check failed:", (e as Error).message);
    return false;
  }
}
