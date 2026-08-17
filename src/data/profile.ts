export type Role = "admin" | "toko" | "courier" | "customer";

export type Profile = {
  id: string;
  username: string;
  password: string;
  role: Role;
  requested_role: Role;
  approved: boolean;
  full_name?: string | null;
  bio?: string | null;
  avatar_path?: string | null;
  created_at?: string;
};
