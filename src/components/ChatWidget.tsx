import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { chatsApi, profileApi } from "@/data/productsApi";
import { getAvatarOrDefaultUrl } from "@/lib/supabase";
import type { Product } from "@/data/products";

type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string | null;
};

export function ChatWidget({ product }: { product: Product }) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tokoName, setTokoName] = useState("Toko");
  const [tokoAvatar, setTokoAvatar] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const tokoId = product.createdBy;

  useEffect(() => {
    if (!open || !profile || !tokoId) return;
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      try {
        const room = await chatsApi.getOrCreateRoom(profile.id, tokoId, String(product.id));
        setRoomId(room.id);
        const tokoProfile = await profileApi.getById(tokoId);
        if (tokoProfile) {
          setTokoName(tokoProfile.full_name ?? tokoProfile.username);
          setTokoAvatar(getAvatarOrDefaultUrl(tokoProfile.avatar_path));
        }
        const msgs = await chatsApi.listMessages(room.id);
        if (!cancelled) setMessages(msgs as ChatMessage[]);
        await chatsApi.markRead(room.id, profile.id);
      } catch (e) {
        console.error("Chat init error:", (e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    const timer = setInterval(() => {
      if (roomId) {
        chatsApi.listMessages(roomId).then((m) => setMessages(m as ChatMessage[]));
      }
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [open, profile, tokoId, product.id, roomId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!profile || !roomId) return;
    const trimmed = input.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const msg = await chatsApi.sendMessage(roomId, profile.id, trimmed);
      setMessages((prev) => [...prev, msg as ChatMessage]);
      setInput("");
    } catch (e) {
      console.error("Send message error:", (e as Error).message);
    }
    setSending(false);
  };

  if (!profile) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500"
        title="Chat dengan toko"
      >
        <MessageCircle size={16} />
        Chat dengan Toko
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-end">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative m-4 flex h-96 w-80 flex-shrink-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 rounded-t-2xl border-b border-slate-200 bg-slate-50 px-4 py-3">
              {tokoAvatar ? (
                <img src={tokoAvatar} alt={tokoName} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-200">
                  <User size={16} className="text-slate-400" />
                </div>
              )}
              <span className="font-medium text-slate-900">{tokoName}</span>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-3 py-3"
            >
              {loading ? (
                <p className="text-center text-xs text-slate-500">Memuat pesan...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-xs text-slate-500">
                  Mulai percakapan dengan {tokoName}.
                </p>
              ) : (
                <div className="space-y-2">
                  {messages.map((m) => {
                    const isMine = m.sender_id === profile.id;
                    return (
                      <div
                        key={m.id}
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                          isMine
                            ? "ml-auto bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {m.body}
                        <div
                          className={`mt-0.5 text-[10px] ${
                            isMine ? "text-indigo-200" : "text-slate-400"
                          }`}
                        >
                          {m.created_at ? new Date(m.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-slate-200 p-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={roomId ? "Ketik pesan..." : "Menyambungkan..."}
                onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
                readOnly={!roomId}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={sending || !roomId || !input.trim()}
                className="rounded-lg bg-indigo-600 p-2 text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
                title="Kirim"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
