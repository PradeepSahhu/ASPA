import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";

const API = "http://localhost:3000";

const actorColor = (actor) => {
  if (actor === "ADMIN") return "#4dabf7";
  if (actor === "AUTHOR") return "#40c057";
  return "#868e96";
};

export function TicketDetailPage() {
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

  // Fetch history then connect socket
  useEffect(() => {
    fetchMessages();
    const socket = io(API, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("conversation:join", { conversationId: ticketId });
    });

    socket.on("message:new", (msg) => {
      setMessages((prev) => {
        // deduplicate by id in case sender also gets the REST response
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

  // Auto-scroll to bottom on new messages
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
      // Don't push here — socket will deliver it via message:new
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

    // Show mention menu when the current token starts with '@'.
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
    <div
      style={{
        fontFamily: "sans-serif",
        minHeight: "100vh",
        background: "#f8f9fa",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#fff",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          borderBottom: "1px solid #dee2e6",
        }}
      >
        <button
          onClick={() => navigate(backPath)}
          style={{
            padding: "6px 14px",
            background: "#f1f3f5",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: "16px" }}>Ticket Conversation</h2>
          <span style={{ fontSize: "12px", color: "#868e96" }}>
            #{ticketId}
          </span>
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "13px",
            color: "#495057",
          }}
        >
          Logged in as <strong>{user.name || user.email}</strong> ({role})
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {loading ? (
          <p style={{ color: "#adb5bd" }}>Loading conversation...</p>
        ) : messages.length === 0 ? (
          <p style={{ color: "#adb5bd" }}>
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.responseActor === currentActor;
            return (
              <div
                key={msg.id}
                style={{
                  maxWidth: "60%",
                  alignSelf:
                    msg.responseActor === "ADMIN" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    background: isOwnMessage ? "#e7f5ff" : "#fff",
                    border: isOwnMessage
                      ? "1px solid #74c0fc"
                      : "1px solid #dee2e6",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    boxShadow: isOwnMessage
                      ? "0 0 0 1px rgba(116, 192, 252, 0.15)"
                      : "none",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "14px" }}>{msg.message}</p>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#adb5bd",
                    marginTop: "4px",
                    display: "flex",
                    gap: "8px",
                    justifyContent:
                      msg.responseActor === "ADMIN" ? "flex-end" : "flex-start",
                  }}
                >
                  <span
                    style={{
                      color: actorColor(msg.responseActor),
                      fontWeight: 600,
                    }}
                  >
                    {msg.responseActor}
                  </span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            );
          })
        )}
        {isOtherTyping && (
          <div
            style={{
              maxWidth: "60%",
              alignSelf: "flex-end",
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                color: "#868e96",
                fontStyle: "italic",
              }}
            >
              {typingLabel} is typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        style={{
          background: "#fff",
          borderTop: "1px solid #dee2e6",
          padding: "16px 28px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1, position: "relative" }}>
          {showMentionMenu && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "34px",
                zIndex: 1,
                background: "#fff",
                border: "1px solid #dee2e6",
                borderRadius: "14px",
                padding: "14px 10px 8px",
                boxShadow: "0 6px 14px rgba(0, 0, 0, 0.08)",
              }}
            >
              <button
                type="button"
                onClick={handleMentionSelect}
                style={{
                  width: "100%",
                  background: "#f8f9fa",
                  border: "1px solid #e9ecef",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "8px",
                    background: "#e7f5ff",
                    color: "#1c7ed6",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    border: "1px solid #a5d8ff",
                    flexShrink: 0,
                  }}
                >
                  AI
                </span>
                <span
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#228be6",
                    }}
                  >
                    ASPA LLM
                  </span>
                  <span style={{ fontSize: "11px", color: "#868e96" }}>
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
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #ced4da",
              borderRadius: "999px",
              fontSize: "14px",
              color: "#228be6",
              position: "relative",
              zIndex: 2,
              background: "#fff",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={sending || !text.trim()}
          style={{
            padding: "10px 20px",
            background: "#4dabf7",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
      {error && (
        <p
          style={{
            color: "red",
            padding: "0 28px 12px",
            margin: 0,
            fontSize: "13px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
