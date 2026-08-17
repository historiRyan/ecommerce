import { useEffect, useState, useRef, useCallback } from "react";
import { MessageCircle, User, Send, Search, X, ChevronLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { chatsApi, profileApi } from "@/data/productsApi";
import { getAvatarOrDefaultUrl } from "@/lib/supabase";
import type { Tab } from "@/components/Navbar";

type ChatRoom = {
  id: string;
  customer_id: string;
  toko_id: string;
  product_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string | null;
};

type Participant = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string;
};

export function ChatPage({ onTabChange }: { onTabChange: (tab: Tab) => void }) {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Record<string, Participant>>({});
  const [input, setInput] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchRooms = useCallback(async () => {
    if (!profile) return;
    setLoadingRooms(true);
    try {
      const data = await chatsApi.listRooms(profile.id);
      setRooms(data as ChatRoom[]);
      const ids = new Set<string>();
      data.forEach((r) => {
        ids.add(r.customer_id);
        ids.add(r.toko_id);
      });
      const pMap: Record<string, Participant> = {};
      for (const id of Array.from(ids)) {
        const p = await profileApi.getById(id);
        if (p) {
          pMap[id] = {
            id: p.id,
            username: p.username,
            full_name: p.full_name ?? null,
            avatar_url: getAvatarOrDefaultUrl(p.avatar_path),
          };
        }
      }
      setParticipants(pMap);
    } catch (e) {
      console.error("Fetch rooms error:", (e as Error).message);
    }
    setLoadingRooms(false);
  }, [profile]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const openRoom = async (room: ChatRoom) => {
    setActiveRoom(room);
    setMessages([]);
    setLoadingMessages(true);
    try {
      const msgs = await chatsApi.listMessages(room.id);
      setMessages(msgs as ChatMessage[]);
      if (profile) await chatsApi.markRead(room.id, profile.id);
    } catch (e) {
      console.error("Load messages error:", (e as Error).message);
    }
    setLoadingMessages(false);
  };

  const closeRoom = () => {
    setActiveRoom(null);
  };

  const handleSend = async () => {
    if (!profile || !activeRoom) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const msg = await chatsApi.sendMessage(activeRoom.id, profile.id, trimmed);
      setMessages((prev) => [...prev, msg as ChatMessage]);
      setInput("");
    } catch (e) {
      console.error("Send message error:", (e as Error).message);
    }
    setSending(false);
  };

  const otherParticipant = (room: ChatRoom): Participant => {
    if (profile?.id === room.customer_id) {
      return participants[room.toko_id] ?? {
        id: room.toko_id,
        username: "Toko",
        full_name: null,
        avatar_url: "",
      };
    }
    return participants[room.customer_id] ?? {
      id: room.customer_id,
      username: "Customer",
      full_name: null,
      avatar_url: "",
    };
  };

  if (!profile) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <MessageCircle size={48} className="mx-auto text-slate-300" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Masuk dulu</h1>
        <p className="mt-2 text-slate-600">Anda perlu masuk untuk mengakses obrolan.</p>
        <button
          onClick={() => onTabChange("login")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Masuk
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onTabChange("home")}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
            title="Kembali ke beranda"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Obrolan</h1>
        </div>
      </div>

      <div className="flex h-[640px] rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Room list */}
        <div className="w-80 shrink-0 border-r border-slate-200">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <Search size={15} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari obrolan..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="h-[560px] overflow-y-auto">
            {loadingRooms ? (
              <p className="p-4 text-sm text-slate-500">Memuat...</p>
            ) : rooms.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">
                Belum ada obrolan. Mulai chat dari halaman produk.
              </p>
            ) : (
              <div className="py-1">
                {rooms.map((r) => {
                  const other = otherParticipant(r);
                  const unread = messages.filter((m) => !m.is_read && m.sender_id !== profile?.id).length;
                  return (
                    <button
                      key={r.id}
                      onClick={() => openRoom(r)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                        activeRoom?.id === r.id ? "bg-indigo-50" : "hover:bg-slate-50"
                      }`}
                    >
                      {other.avatar_url ? (
                        <img src={other.avatar_url} alt={other.username} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400">
                          <User size={18} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">
                          {other.full_name ?? other.username}
                        </p>
                        <p className="text-xs text-slate-500">
                          {r.updated_at ? new Date(r.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </p>
                      </div>
                      {unread > 0 && (
                        <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat thread */}
        <div className="flex flex-1 flex-col">
          {activeRoom ? (
            <>
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                {(() => {
                  const other = otherParticipant(activeRoom);
                  return other.avatar_url ? (
                    <img src={other.avatar_url} alt={other.username} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400">
                      <User size={18} />
                    </div>
                  );
                })()}
                <div>
                  <p className="font-medium text-slate-900">
                    {otherParticipant(activeRoom).full_name ?? otherParticipant(activeRoom).username}
                  </p>
                  <p className="text-xs text-slate-500">
                    {activeRoom.product_id ? "Produk: " + (participants[activeRoom.toko_id]?.username ?? "") : ""}
                  </p>
                </div>
                <button
                  onClick={closeRoom}
                  className="ml-auto rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
                >
                  <X size={18} />
                </button>
              </div>

              <div
                ref={listRef}
                className="flex-1 overflow-y-auto px-4 py-3"
              >
                {loadingMessages ? (
                  <p className="text-center text-sm text-slate-500">Memuat pesan...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-sm text-slate-500">
                    Belum ada pesan. Kirim pesan pertama!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {messages.map((m) => {
                      const isMine = m.sender_id === profile?.id;
                      const sender = participants[m.sender_id];
                      return (
                        <div
                          key={m.id}
                          className={`max-w-[75%] rounded-xl px-3.5 py-2 text-sm ${
                            isMine
                              ? "ml-auto bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {!isMine && (
                            <p className="mb-0.5 text-[10px] font-medium text-slate-500">
                              {sender?.full_name ?? sender?.username ?? "Pengguna"}
                            </p>
                          )}
                          {m.body}
                          <div
                            className={`mt-0.5 text-[10px] ${
                              isMine ? "text-indigo-200" : "text-slate-400"
                            }`}
                          >
                            {m.created_at
                              ? new Date(m.created_at).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 border-t border-slate-200 p-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
                  placeholder="Ketik pesan..."
                  disabled={sending}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="rounded-lg bg-indigo-600 p-2.5 text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
                  title="Kirim"
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-1 flex-col items-center justify-center text-center">
              <MessageCircle size={48} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">Pilih obrolan dari samping kiri.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
