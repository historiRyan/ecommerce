import {
  supabase,
  uploadProductImage,
  deleteProductImage,
  getProductPublicUrl,
  uploadAvatarImage,
  deleteAvatarImage,
  getAvatarPublicUrl,
} from "@/lib/supabase";
import type { Database, Role, OrderStatus, ShipmentStatus } from "@/data/supabase-types";
import type { Product, Category } from "@/data/products";
import type { Profile } from "@/data/profile";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type ChatRoomRow = Database["public"]["Tables"]["chat_rooms"]["Row"];
type ChatMessageRow = Database["public"]["Tables"]["chat_messages"]["Row"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (table: string) => any };

export const productsApi = {
  async list(): Promise<Product[]> {
    const { data: prodRows, error: prodErr } = await db
      .from("products")
      .select("*")
      .gt("stock_quantity", 0)
      .order("created_at", { ascending: false });
    if (prodErr) throw prodErr;
    const { data: catRows, error: catErr } = await db.from("categories").select("*");
    if (catErr) throw catErr;
    const { data: imgRows, error: imgErr } = await db
      .from("product_images")
      .select("*")
      .order("position", { ascending: true });
    if (imgErr) throw imgErr;

    const catMap = new Map<string, CategoryRow>((catRows ?? []).map((c: CategoryRow) => [c.id, c]));
    const imgMap = new Map<string, ProductImageRow[]>();
    for (const img of (imgRows ?? []) as ProductImageRow[]) {
      const arr = imgMap.get(img.product_id) ?? [];
      arr.push(img);
      imgMap.set(img.product_id, arr);
    }

    return (prodRows ?? []).map((p: ProductRow) => mapProduct(p, catMap, imgMap));
  },

  async getBySlug(slug: string): Promise<Product | null> {
    const { data: prodRows, error } = await db
      .from("products")
      .select("*")
      .eq("slug", slug)
      .gt("stock_quantity", 0)
      .limit(1);
    if (error) throw error;
    if (!prodRows || prodRows.length === 0) return null;

    const { data: catRows } = await db.from("categories").select("*");
    const { data: imgRows } = await db.from("product_images").select("*").eq("product_id", prodRows[0].id).order("position", { ascending: true });

    const catMap = new Map<string, CategoryRow>((catRows ?? []).map((c: CategoryRow) => [c.id, c]));
    const imgMap = new Map<string, ProductImageRow[]>();
    for (const img of (imgRows ?? []) as ProductImageRow[]) {
      const arr = imgMap.get(img.product_id) ?? [];
      arr.push(img);
      imgMap.set(img.product_id, arr);
    }

    return mapProduct(prodRows[0] as ProductRow, catMap, imgMap);
  },

  async create(input: {
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    price: number;
    originalPrice?: number;
    categoryId?: string;
    inStock: boolean;
    featured: boolean;
    stockQuantity?: number;
    images: File[];
    createdBy?: string;
  }): Promise<Product> {
    const insertProduct = async (slug: string) =>
      await db
        .from("products")
        .insert({
          name: input.name,
          slug,
          description: input.description,
          short_description: input.shortDescription,
          price: input.price,
          original_price: input.originalPrice ?? null,
          category_id: input.categoryId ?? null,
          in_stock: input.inStock,
          stock_quantity: input.stockQuantity ?? 0,
          featured: input.featured,
          created_by: input.createdBy ?? null,
        })
        .select()
        .single();

    let { data, error } = await insertProduct(input.slug);
    if (error && (error.code === "23505" || error.message?.includes("duplicate key"))) {
      const uniqueSlug = `${input.slug}-${crypto.randomUUID().slice(0, 8)}`;
      const retry = await insertProduct(uniqueSlug);
      if (retry.error) throw retry.error;
      ({ data: data, error: error } = retry);
    } else if (error) {
      throw error;
    }
    const prod = data as ProductRow;

    const insertedIds: ProductImageRow[] = [];
    for (let i = 0; i < input.images.length; i++) {
      const file = input.images[i];
      const path = await uploadProductImage(file, prod.id);
      if (!path) continue;
      const { data: imgData, error: imgErr } = await db
        .from("product_images")
        .insert({
          product_id: prod.id,
          url: path,
          alt: `${prod.name} ${i + 1}`,
          position: i,
        })
        .select()
        .single();
      if (!imgErr && imgData) insertedIds.push(imgData as ProductImageRow);
    }

    const imgMap = new Map<string, ProductImageRow[]>([[prod.id, insertedIds]]);
    const { data: catRows } = await db.from("categories").select("*");
    const catMap = new Map<string, CategoryRow>((catRows ?? []).map((c: CategoryRow) => [c.id, c]));

    return mapProduct(prod, catMap, imgMap);
  },

  async update(id: string, input: {
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    price: number;
    originalPrice?: number;
    categoryId?: string;
    inStock: boolean;
    featured: boolean;
    stockQuantity?: number;
  }): Promise<void> {
    const { error } = await db
      .from("products")
      .update({
        name: input.name,
        slug: input.slug,
        description: input.description,
        short_description: input.shortDescription,
        price: input.price,
        original_price: input.originalPrice ?? null,
        category_id: input.categoryId ?? null,
        in_stock: input.inStock,
        stock_quantity: input.stockQuantity ?? 0,
        featured: input.featured,
      })
      .eq("id", id);
    if (error) throw error;
  },

  async updateImages(productId: string, files: File[], removePaths: string[], removeIds: string[]) {
    for (const path of removePaths) {
      await deleteProductImage(path);
    }
    for (const id of removeIds) {
      await db.from("product_images").delete().eq("id", id);
    }

    const { data: existing } = await db.from("product_images").select("*").eq("product_id", productId).order("position", { ascending: true });
    const count = (existing ?? []).length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = await uploadProductImage(file, productId);
      if (!path) continue;
      await db.from("product_images").insert({
        product_id: productId,
        url: path,
        alt: ``,
        position: count + i,
      });
    }
  },

  async delete(id: string): Promise<void> {
    const { data: imgs } = await db.from("product_images").select("url").eq("product_id", id);
    for (const img of (imgs ?? []) as ProductImageRow[]) {
      await deleteProductImage(img.url);
    }
    const { error } = await db.from("products").delete().eq("id", id);
    if (error) throw error;
  },
};

export const categoriesApi = {
  async list(): Promise<Category[]> {
    const { data, error } = await db.from("categories").select("*").order("order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((c: CategoryRow) => ({ id: c.id, name: c.name, slug: c.slug, count: 0 }));
  },

  async create(name: string): Promise<Category> {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const { data: maxRows } = await db.from("categories").select("order").order("order", { ascending: false }).limit(1);
    const order = (maxRows && maxRows.length > 0 ? maxRows[0].order : 0) + 1;
    const { data, error } = await db.from("categories").insert({ name, slug, order }).select().single();
    if (error) throw error;
    const c = data as CategoryRow;
    return { id: c.id, name: c.name, slug: c.slug, count: 0 };
  },

  async delete(id: string): Promise<void> {
    const { error } = await db.from("categories").delete().eq("id", id);
    if (error) throw error;
  },
};

export const accountsApi = {
  async list(): Promise<Profile[]> {
    const { data, error } = await db.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Profile[];
  },

  async create(username: string, password: string, role: Role): Promise<void> {
    const { error } = await db.from("profiles").insert({
      username,
      password,
      role,
      requested_role: role,
      approved: true,
    });
    if (error) throw error;
  },

  async updateRole(id: string, role: Role): Promise<void> {
    const { error } = await db.from("profiles").update({ role }).eq("id", id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db.from("profiles").delete().eq("id", id);
    if (error) throw error;
  },

  async listPendingToko(): Promise<Profile[]> {
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .eq("requested_role", "toko")
      .eq("approved", false)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Profile[];
  },

  async approveToko(id: string): Promise<void> {
    const { error } = await db
      .from("profiles")
      .update({ approved: true, role: "toko" })
      .eq("id", id);
    if (error) throw error;
  },

  async rejectToko(id: string): Promise<void> {
    const { error } = await db
      .from("profiles")
      .delete()
      .eq("id", id)
      .eq("approved", false);
    if (error) throw error;
  },

  async listPendingCourier(): Promise<Profile[]> {
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .eq("requested_role", "courier")
      .eq("approved", false)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Profile[];
  },

  async approveCourier(id: string): Promise<void> {
    const { error } = await db
      .from("profiles")
      .update({ approved: true, role: "courier" })
      .eq("id", id);
    if (error) throw error;
  },

  async rejectCourier(id: string): Promise<void> {
    const { error } = await db
      .from("profiles")
      .delete()
      .eq("id", id)
      .eq("approved", false);
    if (error) throw error;
  },
};

export type OrderItemInput = {
  productId: string | null;
  quantity: number;
  price: number;
  createdBy?: string | null;
};

export type ReviewRow = Database["public"]["Tables"]["product_reviews"]["Row"];
export type ReviewWithProfileRow = ReviewRow & {
  username: string;
  full_name: string | null;
  avatar_path: string | null;
};

export const reviewsApi = {
  async listByProduct(productId: string, orderId?: string): Promise<ReviewWithProfileRow[]> {
    let q = db
      .from("product_reviews_v")
      .select("*")
      .eq("product_id", productId);
    if (orderId) {
      q = q.eq("order_id", orderId);
    }
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ReviewWithProfileRow[];
  },

  async myReview(productId: string, customerId: string, orderId?: string): Promise<ReviewRow | null> {
    let q = db
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("customer_id", customerId);
    if (orderId) {
      q = q.eq("order_id", orderId);
    }
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    return (data ?? null) as ReviewRow | null;
  },

  async hasBoughtProduct(productId: string, customerId: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny.rpc("customer_bought_product", {
      p_customer: customerId,
      p_product: productId,
    });
    if (error) throw error;
    return (data as boolean) ?? false;
  },

  async hasBoughtInOrder(customerId: string, orderId: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny.rpc("customer_bought_in_order", {
      p_customer: customerId,
      p_order: orderId,
    });
    if (error) throw error;
    return (data as boolean) ?? false;
  },

  async create(input: {
    productId: string;
    orderId: string;
    customerId: string;
    rating: number;
    title?: string;
    body?: string;
  }): Promise<ReviewRow> {
    const { data, error } = await db
      .from("product_reviews")
      .insert({
        product_id: input.productId,
        order_id: input.orderId,
        customer_id: input.customerId,
        rating: input.rating,
        title: input.title ?? null,
        body: input.body ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as ReviewRow;
  },

  async update(id: string, input: { rating?: number; title?: string | null; body?: string | null }): Promise<ReviewRow> {
    const { data, error } = await db
      .from("product_reviews")
      .update({
        rating: input.rating,
        title: input.title ?? null,
        body: input.body ?? null,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as ReviewRow;
  },

  async remove(id: string): Promise<void> {
    const { error } = await db.from("product_reviews").delete().eq("id", id);
    if (error) throw error;
  },
};

export const ordersApi = {
  async create(input: {
    customerId: string;
    tokoId?: string;
    totalAmount: number;
    shippingAddress?: string;
    notes?: string;
    items: OrderItemInput[];
  }): Promise<OrderRow> {
    const resolvedTokoId =
      input.tokoId ??
      input.items.map((i) => i.createdBy).find((cid): cid is string => !!cid) ??
      null;

    let finalTokoId = resolvedTokoId;
    if (!finalTokoId) {
      const { data: profRows } = await db
        .from("profiles")
        .select("id")
        .eq("username", "toko")
        .single();
      if (profRows?.id) {
        finalTokoId = profRows.id;
      }
    }

    const { data: orderData, error: orderErr } = await db
      .from("orders")
      .insert({
        customer_id: input.customerId,
        toko_id: finalTokoId,
        total_amount: input.totalAmount,
        shipping_address: input.shippingAddress ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (orderErr) throw orderErr;
    const order = orderData as OrderRow;

    const itemsToInsert = input.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId ?? null,
      quantity: item.quantity,
      price: item.price,
    }));
    const { error: itemsErr } = await db.from("order_items").insert(itemsToInsert);
    if (itemsErr) throw itemsErr;

    return order;
  },

  async listByCustomer(customerId: string): Promise<OrderRow[]> {
    const { data, error } = await db
      .from("orders")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as OrderRow[];
  },

  async listByToko(tokoId: string): Promise<OrderRow[]> {
    const { data, error } = await db
      .from("orders")
      .select("*")
      .eq("toko_id", tokoId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as OrderRow[];
  },

  async listAll(): Promise<OrderRow[]> {
    const { data, error } = await db
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as OrderRow[];
  },

  async getById(id: string): Promise<OrderRow | null> {
    const { data, error } = await db.from("orders").select("*").eq("id", id).single();
    if (error) throw error;
    return data as OrderRow;
  },

  async getItems(orderId: string): Promise<OrderItemRow[]> {
    const { data, error } = await db.from("order_items").select("*").eq("order_id", orderId);
    if (error) throw error;
    return (data ?? []) as OrderItemRow[];
  },

  async updateStatus(id: string, status: OrderStatus, notes?: string): Promise<void> {
    const { error } = await db
      .from("orders")
      .update({ status, notes: notes ?? null })
      .eq("id", id);
    if (error) throw error;
  },

  async approveOrder(id: string): Promise<void> {
    await this.updateStatus(id, "assigned_to_courier");
  },

  async approveOrderWithCourier(orderId: string, courierId: string): Promise<void> {
    // Toko menyetujui order dan langsung meng-assign ke kurir.
    // Status order berubah ke assigned_to_courier, dan shipment terbuat.
    const { error } = await db
      .from("orders")
      .update({ status: "assigned_to_courier" })
      .eq("id", orderId);
    if (error) throw error;

    const { data: orderRow } = await db.from("orders").select("toko_id").eq("id", orderId).single();
    const tokoId = orderRow?.toko_id ?? null;

    const { error: shipErr } = await db.from("shipments").insert({
      order_id: orderId,
      courier_id: courierId,
      toko_id: tokoId,
      status: "assigned",
      assigned_at: new Date().toISOString(),
    });
    if (shipErr) throw shipErr;
  },

  async confirmOrder(id: string): Promise<void> {
    await this.updateStatus(id, "pending_toko_approve");
  },

  async rejectOrder(id: string): Promise<void> {
    await this.updateStatus(id, "cancelled");
  },

  async assignToCourier(orderId: string, courierId: string): Promise<void> {
    await db
      .from("orders")
      .update({ status: "assigned_to_courier" })
      .eq("id", orderId);

    const { data: orderRow } = await db.from("orders").select("toko_id").eq("id", orderId).single();
    const tokoId = orderRow?.toko_id ?? null;

    await db.from("shipments").insert({
      order_id: orderId,
      courier_id: courierId,
      toko_id: tokoId,
      status: "assigned",
      assigned_at: new Date().toISOString(),
    });
  },
};

export const shipmentsApi = {
  async listByCourier(courierId: string): Promise<ShipmentRow[]> {
    const { data, error } = await db
      .from("shipments")
      .select("*")
      .eq("courier_id", courierId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ShipmentRow[];
  },

  async getByOrder(orderId: string): Promise<ShipmentRow | null> {
    const { data, error } = await db.from("shipments").select("*").eq("order_id", orderId).single();
    if (error) throw error;
    return data as ShipmentRow;
  },

  async updateStatus(shipmentId: string, status: ShipmentStatus, notes?: string): Promise<void> {
    const update: Record<string, unknown> = { status };
    if (status === "picked_up") update.picked_at = new Date().toISOString();
    if (status === "delivered") update.delivered_at = new Date().toISOString();
    if (notes) update.tracking_notes = notes;

    const { error } = await db.from("shipments").update(update).eq("id", shipmentId);
    if (error) throw error;

    const { data: shipment } = await db.from("shipments").select("order_id").eq("id", shipmentId).single();
    if (shipment?.order_id) {
      const orderStatusMap: Record<ShipmentStatus, OrderStatus> = {
        pending_toko_approve: "pending_toko_approve",
        assigned: "assigned_to_courier",
        picked_up: "in_transit",
        in_transit: "in_transit",
        delivered: "delivered",
        cancelled: "cancelled",
      };
      const { error: orderErr } = await db
        .from("orders")
        .update({ status: orderStatusMap[status] ?? "in_transit" })
        .eq("id", shipment.order_id);
      if (orderErr) throw orderErr;
    }
  },

  async listAll(): Promise<ShipmentRow[]> {
    const { data, error } = await db.from("shipments").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ShipmentRow[];
  },
};

export const profileApi = {
  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await db.from("profiles").select("*").eq("id", id).single();
    if (error) throw error;
    return (data ?? null) as Profile | null;
  },

  async getByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await db.from("profiles").select("*").eq("username", username).maybeSingle();
    if (error) throw error;
    return (data ?? null) as Profile | null;
  },

  async updateProfile(id: string, input: {
    full_name?: string | null;
    bio?: string | null;
    avatar_path?: string | null;
  }): Promise<Profile> {
    const { data, error } = await db.from("profiles")
      .update({
        full_name: input.full_name ?? null,
        bio: input.bio ?? null,
        avatar_path: input.avatar_path !== undefined ? input.avatar_path : undefined,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return (data ?? null) as Profile;
  },

  async uploadAvatar(profileId: string, file: File): Promise<{ path: string; publicUrl: string } | null> {
    const path = await uploadAvatarImage(file, profileId);
    if (!path) return null;
    const publicUrl = getAvatarPublicUrl(path);
    await this.updateProfile(profileId, { avatar_path: path });
    return { path, publicUrl };
  },

  async removeAvatar(profileId: string, path: string): Promise<void> {
    await deleteAvatarImage(path);
    await this.updateProfile(profileId, { avatar_path: null });
  },
};

export const chatsApi = {
  async getTokoIdForProduct(productId: string): Promise<string | null> {
    const { data, error } = await db.from("products").select("created_by").eq("id", productId).single();
    if (error) throw error;
    return (data?.created_by as string | null) ?? null;
  },

  async listRooms(userId: string): Promise<ChatRoomRow[]> {
    const { data, error } = await db
      .from("chat_rooms")
      .select("*")
      .or(`customer_id.eq.${userId},toko_id.eq.${userId}`)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ChatRoomRow[];
  },

  async getRoom(customerId: string, tokoId: string, productId?: string | null): Promise<ChatRoomRow | null> {
    const { data, error } = await db
      .from("chat_rooms")
      .select("*")
      .eq("customer_id", customerId)
      .eq("toko_id", tokoId)
      .eq("product_id", productId ?? null)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as ChatRoomRow | null;
  },

  async createRoom(customerId: string, tokoId: string, productId?: string | null): Promise<ChatRoomRow> {
    const { data, error } = await db
      .from("chat_rooms")
      .insert({ customer_id: customerId, toko_id: tokoId, product_id: productId ?? null })
      .select()
      .single();
    if (error) throw error;
    return data as ChatRoomRow;
  },

  async getOrCreateRoom(customerId: string, tokoId: string, productId?: string | null): Promise<ChatRoomRow> {
    const existing = await this.getRoom(customerId, tokoId, productId ?? null);
    if (existing) return existing;
    return this.createRoom(customerId, tokoId, productId ?? null);
  },

  async listMessages(roomId: string, opts?: { limit?: number }): Promise<ChatMessageRow[]> {
    const { data, error } = await db
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(opts?.limit ?? 100);
    if (error) throw error;
    return (data ?? []) as ChatMessageRow[];
  },

  async sendMessage(roomId: string, senderId: string, body: string): Promise<ChatMessageRow> {
    const { data, error } = await db
      .from("chat_messages")
      .insert({ room_id: roomId, sender_id: senderId, body })
      .select()
      .single();
    if (error) throw error;
    return data as ChatMessageRow;
  },

  async markRead(roomId: string, userId: string): Promise<void> {
    const { error } = await db
      .from("chat_messages")
      .update({ is_read: true })
      .eq("room_id", roomId)
      .neq("sender_id", userId)
      .eq("is_read", false);
    if (error) throw error;
  },

  async unreadCount(roomId: string): Promise<number> {
    const { count, error } = await db
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId)
      .eq("is_read", false);
    if (error) throw error;
    return count ?? 0;
  },

  async unreadCountAll(userId: string): Promise<number> {
    const rooms = await this.listRooms(userId);
    let total = 0;
    for (const r of rooms) {
      const c = await this.unreadCount(r.id);
      total += c;
    }
    return total;
  },
};

function mapProduct(
  p: ProductRow,
  catMap: Map<string, CategoryRow>,
  imgMap: Map<string, ProductImageRow[]>
): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    shortDescription: p.short_description ?? "",
    price: Number(p.price),
    originalPrice: p.original_price ? Number(p.original_price) : undefined,
    category: catMap.get(p.category_id ?? "")?.name ?? "Lainnya",
    categoryId: p.category_id ?? null,
    inStock: p.in_stock,
    stockQuantity: p.stock_quantity ?? 0,
    featured: p.featured,
    rating: p.rating ?? 0,
    reviewCount: p.review_count ?? 0,
    images: (imgMap.get(p.id) ?? []).map((i) => getProductPublicUrl(i.url)),
    imagePaths: (imgMap.get(p.id) ?? []).map((i) => i.url),
    imageIds: (imgMap.get(p.id) ?? []).map((i) => i.id),
    colors: [],
    sizes: [],
    features: [],
    reviews: [],
    createdBy: p.created_by ?? null,
    createdAt: p.created_at ?? "",
  };
}
