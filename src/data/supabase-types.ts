export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          password: string;
           role: "admin" | "toko" | "courier" | "customer";
           requested_role: "admin" | "toko" | "courier" | "customer";
           approved: boolean;
           full_name: string | null;
           bio: string | null;
           avatar_path: string | null;
           created_at: string | null;
        };
        Insert: {
          id?: string;
          username: string;
          password: string;
        role?: "admin" | "toko" | "courier" | "customer";
           requested_role?: "admin" | "toko" | "courier" | "customer";
          approved?: boolean;
          full_name?: string | null;
          bio?: string | null;
          avatar_path?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          password?: string;
        role?: "admin" | "toko" | "courier" | "customer";
           requested_role?: "admin" | "toko" | "courier" | "customer";
          approved?: boolean;
          full_name?: string | null;
          bio?: string | null;
          avatar_path?: string | null;
          created_at?: string | null;
        };
      };
      chat_rooms: {
        Row: {
          id: string;
          customer_id: string;
          toko_id: string;
          product_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          toko_id: string;
          product_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string;
          toko_id?: string;
          product_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          room_id: string;
          sender_id: string;
          body: string;
          is_read: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          sender_id: string;
          body: string;
          is_read?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          sender_id?: string;
          body?: string;
          is_read?: boolean;
          created_at?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          order: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          order?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          order?: number;
          created_at?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          short_description: string | null;
          price: number;
          original_price: number | null;
          category_id: string | null;
          in_stock: boolean;
          featured: boolean;
          stock_quantity?: number;
          rating: number | null;
          review_count: number | null;
          created_at: string | null;
          updated_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          short_description?: string | null;
          price?: number;
          original_price?: number | null;
          category_id?: string | null;
          in_stock?: boolean;
          stock_quantity?: number;
          featured?: boolean;
          rating?: number | null;
          review_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          short_description?: string | null;
          price?: number;
          original_price?: number | null;
          category_id?: string | null;
          in_stock?: boolean;
          stock_quantity?: number;
          featured?: boolean;
          rating?: number | null;
          review_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: string | null;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt: string | null;
          position: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt?: string | null;
          position?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          alt?: string | null;
          position?: number;
          created_at?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string | null;
          toko_id: string | null;
          total_amount: number;
          status: "pending_customer_confirm" | "pending_toko_approve" | "assigned_to_courier" | "in_transit" | "delivered" | "cancelled";
          shipping_address: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          toko_id?: string | null;
          total_amount?: number;
          status?: "pending_customer_confirm" | "pending_toko_approve" | "assigned_to_courier" | "in_transit" | "delivered" | "cancelled";
          shipping_address?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          toko_id?: string | null;
          total_amount?: number;
          status?: "pending_customer_confirm" | "pending_toko_approve" | "assigned_to_courier" | "in_transit" | "delivered" | "cancelled";
          shipping_address?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      shipments: {
        Row: {
          id: string;
          order_id: string;
          courier_id: string | null;
          toko_id: string | null;
          status: "pending_toko_approve" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled";
          tracking_notes: string | null;
          assigned_at: string | null;
          picked_at: string | null;
          delivered_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          courier_id?: string | null;
          toko_id?: string | null;
          status?: "pending_toko_approve" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled";
          tracking_notes?: string | null;
          assigned_at?: string | null;
          picked_at?: string | null;
          delivered_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          courier_id?: string | null;
          toko_id?: string | null;
          status?: "pending_toko_approve" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled";
          tracking_notes?: string | null;
          assigned_at?: string | null;
          picked_at?: string | null;
          delivered_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          quantity: number;
          price: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          quantity?: number;
          price?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          quantity?: number;
          price?: number;
          created_at?: string | null;
        };
      };
      product_reviews: {
        Row: {
          id: string;
          product_id: string;
          order_id: string;
          customer_id: string;
          rating: number;
          title: string | null;
          body: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          order_id: string;
          customer_id: string;
          rating: number;
          title?: string | null;
          body?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          order_id?: string;
          customer_id?: string;
          rating?: number;
          title?: string | null;
          body?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

export type Role = "admin" | "toko" | "courier" | "customer";

export type OrderStatus =
  | "pending_customer_confirm"
  | "pending_toko_approve"
  | "assigned_to_courier"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type ShipmentStatus =
  | "pending_toko_approve"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";
