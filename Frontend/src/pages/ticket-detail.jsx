import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";

const API = "http://localhost:3000";

const actorColor = (actor) => {
  if (actor === "ADMIN") return "text-blue-400";
  if (actor === "AUTHOR") return "text-emerald-400";
  return "text-slate-400";
};

export function TicketDetailPage({ isDark, onToggleTheme }) {
  const shellClass = isDark
    ? "bg-[radial-gradient(circle_at_top_left,#12314f_0%,#06080d_58%)] text-slate-100"
    : "bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#f8fafc_58%)] text-slate-900";
  const headerClass = isDark
    ? "border-slate-700/70 bg-slate-900/80"
    : "border-slate-200 bg-white/90";
  const panelClass = isDark
    ? "border-slate-700 bg-slate-900/80"
    : "border-slate-200 bg-white";
  const inputClass = isDark
    ? "border-slate-600 bg-slate-950 text-blue-300 placeholder:text-slate-500"
    : "border-slate-300 bg-white text-blue-700 placeholder:text-slate-400";

  const { ticketId } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [typingLabel, setTypingLabel] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const userLabel = user.name || user.email || role || "User";

  useEffect(() => {
    fetchMessages();
    const socket = io(API, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("conversation:join", { conversationId: ticketId });
    });

    socket.on("message:new", (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("typing:indicator", ({ isTyping, userLabel: senderLabel }) => {
      setIsOtherTyping(Boolean(isTyping));
      setTypingLabel(senderLabel || "User");
    });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.disconnect();
    };
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/conversation/${ticketId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setMessages(data.data || []);
      else setError(data.message || "Failed to load messages");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    try {
      if (socketRef.current) {
        socketRef.current.emit("typing:stop", {
          conversationId: ticketId,
          userLabel,
        });
      }

      const res = await fetch(`${API}/conversation/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to send message");
        return;
      }

      setText("");
      setShowMentionMenu(false);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setText(value);

    const mentionMatch = value.match(/(^|\s)@([^\s]*)$/);
    setShowMentionMenu(Boolean(mentionMatch));

    if (!socketRef.current) return;

    if (value.trim()) {
      socketRef.current.emit("typing:start", {
        conversationId: ticketId,
        userLabel,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("typing:stop", {
          conversationId: ticketId,
          userLabel,
        });
      }, 1200);
    } else {
      socketRef.current.emit("typing:stop", {
        conversationId: ticketId,
        userLabel,
      });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleMentionSelect = () => {
    const updatedValue = text.replace(/(^|\s)@([^\s]*)$/, "$1@ASPA_LLM ");
    setText(updatedValue);
    setShowMentionMenu(false);
  };

  const backPath = role === "admin" ? "/admin-dashboard" : "/dashboard";
  const currentActor = role === "admin" ? "ADMIN" : "AUTHOR";

  return (
    <div className={`flex min-h-screen flex-col ${shellClass}`}>
      <header
        className={`flex flex-wrap items-center gap-3 border-b px-4 py-3 backdrop-blur sm:px-7 ${headerClass}`}
      >
        <button
          onClick={() => navigate(backPath)}
          className={`rounded-md border px-3 py-1.5 text-sm transition hover:border-blue-500 ${isDark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-slate-300 bg-white text-slate-800"}`}
        >
          ← Back
        </button>

        <div>
          <h2 className="text-sm font-semibold sm:text-base">
            Ticket Conversation
          </h2>
          <span
            className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            #{ticketId}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white transition ${isDark ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500"}`}
          >
            {isDark ? "Light Theme" : "Black Theme"}
          </button>
          <span
            className={`text-xs sm:text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            Logged in as <strong>{user.name || user.email}</strong> ({role})
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-7">
          <div className="flex flex-col gap-3">
            {loading ? (
              <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                Loading conversation...
              </p>
            ) : messages.length === 0 ? (
              <p className={isDark ? "text-slate-400" : "text-slate-600"}>
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.responseActor === currentActor;
                return (
                  <div
                    key={msg.id}
                    className={`max-w-[78%] sm:max-w-[60%] ${msg.responseActor === "ADMIN" ? "self-end" : "self-start"}`}
                  >
                    <div
                      className={`rounded-lg border px-3.5 py-2.5 text-sm ${
                        isOwnMessage
                          ? isDark
                            ? "border-blue-400/70 bg-blue-900/35"
                            : "border-blue-300 bg-blue-50"
                          : isDark
                            ? "border-slate-700 bg-slate-900/80"
                            : "border-slate-200 bg-white"
                      }`}
                    >
                      <p>{msg.message}</p>
                    </div>
                    <div
                      className={`mt-1 flex gap-2 text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"} ${msg.responseActor === "ADMIN" ? "justify-end" : "justify-start"}`}
                    >
                      <span
                        className={`font-semibold ${actorColor(msg.responseActor)}`}
                      >
                        {msg.responseActor}
                      </span>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {isOtherTyping && (
              <div
                className={`max-w-[78%] self-end rounded-lg border px-3 py-2 text-xs italic sm:max-w-[60%] ${isDark ? "border-slate-700 bg-slate-900/80 text-slate-400" : "border-slate-200 bg-white text-slate-600"}`}
              >
                {typingLabel} is typing...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <form
          onSubmit={handleSend}
          className={`border-t px-4 py-3 sm:px-7 ${headerClass}`}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              {showMentionMenu && (
                <div
                  className={`absolute inset-x-0 bottom-12 z-10 rounded-2xl border p-2 shadow-xl ${panelClass}`}
                >
                  <button
                    type="button"
                    onClick={handleMentionSelect}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition hover:border-blue-500 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-blue-400/50 bg-blue-900/40 text-[11px] font-bold text-blue-300">
                      AI
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-blue-300">
                        ASPA LLM
                      </span>
                      <span className="text-xs text-slate-400">
                        Ask ASPA LLM to help draft a response
                      </span>
                    </span>
                  </button>
                </div>
              )}

              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={handleInputChange}
                className={`w-full rounded-full border px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 ${inputClass}`}
              />
            </div>

            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>

        {error && <p className="px-7 pb-3 text-sm text-red-400">{error}</p>}
      </main>
    </div>
  );
}
