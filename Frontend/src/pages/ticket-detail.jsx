import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { ThemeToggle } from "../components/theme-toggle.jsx";

const API = "http://localhost:3000";

const actorColor = (actor) => {
  if (actor === "ADMIN") return "text-blue-400";
  if (actor === "AUTHOR") return "text-emerald-400";
  return "text-slate-400";
};

const priorityColor = (score) => {
  if (score === 4) return "bg-rose-600";
  if (score === 3) return "bg-orange-500";
  if (score === 2) return "bg-amber-500";
  if (score === 1) return "bg-blue-600";
  return "bg-slate-500";
};

const priorityLabel = (score) => {
  if (score === 4) return "Critical";
  if (score === 3) return "High";
  if (score === 2) return "Medium";
  if (score === 1) return "Low";
  return "Unset";
};

const countWords = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};

const getDescriptionPreview = (text, isExpanded) => {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= 200) return text;
  if (isExpanded) return text;
  return words.slice(0, 200).join(" ") + "...";
};

const normalizeLLMContent = (payload) => {
  if (payload === null || payload === undefined) return "No response from LLM";
  if (typeof payload === "string") return payload;
  if (typeof payload === "number" || typeof payload === "boolean") {
    return String(payload);
  }

  if (typeof payload === "object") {
    if (typeof payload.result === "string") return payload.result;
    if (typeof payload.message === "string") return payload.message;

    try {
      return JSON.stringify(payload);
    } catch {
      return "No response from LLM";
    }
  }

  return "No response from LLM";
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PRIORITIES = [
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "High" },
  { value: 4, label: "Critical" },
];

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

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const [typingLabel, setTypingLabel] = useState("");
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);

  // Admin panel state
  const [selectedPriority, setSelectedPriority] = useState("");
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState("");
  const [editingNoteText, setEditingNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState("");
  const [llmChat, setLlmChat] = useState([]);
  const [llmInput, setLlmInput] = useState("");
  const [activePanel, setActivePanel] = useState("info"); // info, llm
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [editedDraft, setEditedDraft] = useState("");
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [isSendingDraft, setIsSendingDraft] = useState(false);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const userLabel = user.name || user.email || role || "User";
  const isAdmin = role === "admin";

  useEffect(() => {
    fetchTicketDetails();
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

  useEffect(() => {
    if (isAdmin && activePanel === "info") {
      fetchNotes();
    }
  }, [isAdmin, activePanel, ticketId]);

  const fetchTicketDetails = async () => {
    try {
      const res = await fetch(`${API}/ticket/getTicket/${ticketId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setTicket(data.data);
        setSelectedPriority(data.data.priorityScore || "");
        if (Array.isArray(data.data.notes)) {
          setNotes(data.data.notes);
        }
        if (isAdmin && data.data.aiDraft) {
          setAiDraft(data.data.aiDraft);
          setEditedDraft(data.data.aiDraft);
        }
      }
    } catch (err) {
      console.error("Error fetching ticket:", err);
    }
  };

  const fetchNotes = async () => {
    if (!isAdmin) return;

    setIsNotesLoading(true);
    try {
      const res = await fetch(`${API}/ticket-note/ticket/${ticketId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setNotes(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setIsNotesLoading(false);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/conversation/${ticketId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.data || []);
      } else {
        setError(data.message || "Failed to load messages");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const pollForLlmConversationMessage = async (baselineCount) => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await sleep(1500);

      try {
        const res = await fetch(`${API}/conversation/${ticketId}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) continue;

        const nextMessages = data.data || [];
        setMessages(nextMessages);

        const hasNewLlmMessage = nextMessages
          .slice(baselineCount)
          .some((message) => message.responseActor === "LLM");

        if (hasNewLlmMessage) {
          return;
        }
      } catch (error) {
        console.error("Error polling for LLM message:", error);
      }
    }
  };

  const handleUpdatePriority = async () => {
    if (!selectedPriority) return;
    setUpdatingPriority(true);
    try {
      const res = await fetch(`${API}/ticket/overridePriority`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ticketId,
          priorityScore: parseInt(selectedPriority),
        }),
      });
      if (res.ok) {
        fetchTicketDetails();
      }
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await fetch(`${API}/ticket-note/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ticketId,
          message: newNote,
          visibility: "ADMIN",
        }),
      });
      if (res.ok) {
        setNewNote("");
        fetchNotes();
      }
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleStartEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.message || "");
  };

  const handleSaveNote = async () => {
    if (!editingNoteId || !editingNoteText.trim()) return;
    setIsSavingNote(true);
    try {
      const res = await fetch(`${API}/ticket-note/update/${editingNoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: editingNoteText }),
      });
      if (res.ok) {
        setEditingNoteId("");
        setEditingNoteText("");
        fetchNotes();
      }
    } catch (error) {
      console.error("Error updating note:", error);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!noteId) return;
    setDeletingNoteId(noteId);
    try {
      const res = await fetch(`${API}/ticket-note/delete/${noteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        fetchNotes();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    } finally {
      setDeletingNoteId("");
    }
  };

  const handleLlmChat = async () => {
    if (!llmInput.trim()) return;
    setLlmChat([...llmChat, { role: "user", content: llmInput }]);
    try {
      const res = await fetch(`${API}/llm/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ticketId,
          query: llmInput,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const llmText = normalizeLLMContent(data.response || data.data);
        setLlmChat((prev) => [
          ...prev,
          { role: "assistant", content: llmText },
        ]);
      }
    } catch (error) {
      console.error("Error with LLM chat:", error);
    }
    setLlmInput("");
  };

  const handleSendDraft = async () => {
    if (!editedDraft.trim()) return;
    setIsSendingDraft(true);
    setError("");
    try {
      const res = await fetch(`${API}/conversation/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: editedDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to send draft");
        return;
      }

      // Reset draft state after successful send
      setEditedDraft("");
      setIsEditingDraft(false);
      fetchMessages();
    } catch (error) {
      console.error("Error sending draft:", error);
      setError("Failed to send draft");
    } finally {
      setIsSendingDraft(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (ticket?.status === "RESOLVED") return;
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

      // Check if message mentions ASPA_LLM or ASTRA_LLM
      const hasLLMMention = /@(?:ASPA|ASTRA)_LLM\b/i.test(text);
      const messageToSend = text.trim();

      // First, send the user message to save it
      const res = await fetch(`${API}/conversation/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: messageToSend }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to send message");
        return;
      }

      // If message mentions ASPA_LLM, send to LLM endpoint
      if (hasLLMMention) {
        // Extract message without the mention
        const llmPrompt = messageToSend
          .replace(/@(?:ASPA|ASTRA)_LLM\s*/gi, "")
          .trim();

        if (!llmPrompt) {
          setError("Please add a prompt after @ASTRA_LLM");
          return;
        }

        try {
          const llmRes = await fetch(`${API}/llm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              ticketId,
              prompt: llmPrompt,
            }),
          });

          if (llmRes.ok) {
            pollForLlmConversationMessage(messages.length);
          }
        } catch (llmError) {
          console.error("Error calling LLM:", llmError);
          // Don't fail the message send if LLM fails
        }
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
    if (ticket?.status === "RESOLVED") return;
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

  const handleInputKeyDown = (e) => {
    if (!showMentionMenu || isResolved) return;

    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      handleMentionSelect();
    }

    if (e.key === "Escape") {
      setShowMentionMenu(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!ticketId || ticket?.status === "RESOLVED") return;
    setResolving(true);
    setError("");
    try {
      const res = await fetch(`${API}/ticket/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ticketId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to resolve ticket");
        return;
      }
      await fetchTicketDetails();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setResolving(false);
    }
  };

  const handleUnresolveTicket = async () => {
    if (!isAdmin || !ticketId || ticket?.status !== "RESOLVED") return;
    setResolving(true);
    setError("");
    try {
      const res = await fetch(`${API}/ticket/unresolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ticketId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to unresolve ticket");
        return;
      }
      await fetchTicketDetails();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setResolving(false);
    }
  };

  const backPath = role === "admin" ? "/admin-dashboard" : "/dashboard";
  const currentActor = isAdmin ? "ADMIN" : "AUTHOR";
  const isResolved = ticket?.status === "RESOLVED";

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
          {isAdmin && isResolved ? (
            <button
              onClick={handleUnresolveTicket}
              disabled={resolving}
              className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resolving ? "Updating..." : "Unresolve Ticket"}
            </button>
          ) : (
            <button
              onClick={handleResolveTicket}
              disabled={resolving || isResolved}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white transition ${isResolved ? "bg-emerald-700/70 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-500"}`}
            >
              {isResolved
                ? "Resolved"
                : resolving
                  ? "Resolving..."
                  : "Mark Resolved"}
            </button>
          )}
          <ThemeToggle isDark={isDark} onToggleTheme={onToggleTheme} />
          <span
            className={`text-xs sm:text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            Logged in as <strong>{user.name || user.email}</strong> ({role})
          </span>
        </div>
      </header>

      <main
        className={`flex flex-row flex-1 gap-4 overflow-hidden ${isAdmin ? "p-4 sm:p-6 lg:pr-92" : ""}`}
      >
        {/* Main Chat Area */}
        <div
          className={`flex flex-1 flex-col overflow-hidden ${isAdmin ? "" : "px-4 py-5 sm:px-7"}`}
        >
          <div
            className={`flex-1 overflow-y-auto ${isAdmin ? "" : "px-4 py-5 sm:px-7"}`}
          >
            <div className="flex flex-col gap-4">
              {/* Ticket Header and Description */}
              {ticket && !loading && (
                <div className={`rounded-lg border p-4 ${panelClass}`}>
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold break-word">
                      {ticket.header}
                    </h2>

                    {ticket.detailDescription && (
                      <div className="space-y-2">
                        <p
                          className={`text-sm leading-relaxed whitespace-pre-wrap break-word ${
                            isDark ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          {getDescriptionPreview(
                            ticket.detailDescription,
                            isDescriptionExpanded,
                          )}
                        </p>

                        {countWords(ticket.detailDescription) > 200 && (
                          <button
                            onClick={() =>
                              setIsDescriptionExpanded(!isDescriptionExpanded)
                            }
                            className={`text-xs font-semibold transition ${
                              isDark
                                ? "text-blue-400 hover:text-blue-300"
                                : "text-blue-600 hover:text-blue-700"
                            }`}
                          >
                            {isDescriptionExpanded ? "Show Less" : "Show More"}{" "}
                            ({countWords(ticket.detailDescription)} words)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Messages */}
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
          </div>

          <form
            onSubmit={handleSend}
            className={`border-t px-4 py-3 ${isAdmin ? "sm:px-0" : "sm:px-7"} ${headerClass}`}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                {showMentionMenu && !isResolved && (
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
                  placeholder={
                    isResolved
                      ? "This ticket is resolved. If you think this is a mistake, please create another ticket message."
                      : "Type a message..."
                  }
                  value={text}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  disabled={isResolved}
                  className={`w-full rounded-full border px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 ${inputClass}`}
                />
              </div>

              <button
                type="submit"
                disabled={isResolved || sending || !text.trim()}
                className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>

          {isResolved && (
            <p
              className={`px-4 pb-2 text-xs ${isDark ? "text-amber-300" : "text-amber-700"}`}
            >
              This ticket is resolved. If you think this is a mistake, please
              create another ticket message.
            </p>
          )}

          {error && (
            <p
              className={`px-4 pb-3 text-sm text-red-400 ${isAdmin ? "sm:px-0" : "sm:px-7"}`}
            >
              {error}
            </p>
          )}
        </div>

        {/* Admin Right Panel */}
        {isAdmin && ticket && (
          <div
            className={`w-80 shrink-0 flex flex-col gap-2 overflow-hidden rounded-lg border lg:fixed lg:right-6 lg:top-23 lg:h-[calc(100vh-116px)] ${panelClass}`}
          >
            {/* Panel Tabs */}
            <div className="flex gap-2 border-b p-3">
              <button
                onClick={() => setActivePanel("info")}
                className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition ${
                  activePanel === "info"
                    ? isDark
                      ? "bg-blue-600/40 text-blue-200"
                      : "bg-blue-100 text-blue-700"
                    : isDark
                      ? "text-slate-400 hover:text-slate-300"
                      : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Info
              </button>
              {aiDraft && (
                <button
                  onClick={() => setActivePanel("draft")}
                  className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition ${
                    activePanel === "draft"
                      ? isDark
                        ? "bg-emerald-600/40 text-emerald-200"
                        : "bg-emerald-100 text-emerald-700"
                      : isDark
                        ? "text-slate-400 hover:text-slate-300"
                        : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Draft
                </button>
              )}
              <button
                onClick={() => setActivePanel("llm")}
                className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition ${
                  activePanel === "llm"
                    ? isDark
                      ? "bg-purple-600/40 text-purple-200"
                      : "bg-purple-100 text-purple-700"
                    : isDark
                      ? "text-slate-400 hover:text-slate-300"
                      : "text-slate-600 hover:text-slate-900"
                }`}
              >
                LLM
              </button>
            </div>

            {/* Info Panel */}
            {activePanel === "info" && (
              <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
                <div className="space-y-2">
                  <p
                    className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    TICKET ID
                  </p>
                  <p className="font-mono text-xs break-all">{ticket.id}</p>
                </div>

                <div className="space-y-2">
                  <p
                    className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    AUTHOR
                  </p>
                  <p className="text-sm">{ticket.author?.name}</p>
                  <p className="text-xs">{ticket.author?.email}</p>
                </div>

                <div className="space-y-2">
                  <p
                    className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    CATEGORY
                  </p>
                  <p className="text-sm">{ticket.category || "—"}</p>
                </div>

                <div className="space-y-3">
                  <p
                    className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    UPDATE PRIORITY
                  </p>
                  {selectedPriority && (
                    <div
                      className={`rounded-full px-3 py-1 text-xs text-white inline-block ${priorityColor(parseInt(selectedPriority))}`}
                    >
                      {priorityLabel(parseInt(selectedPriority))}
                    </div>
                  )}
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className={`w-full rounded-md border px-2 py-1 text-xs outline-none ${inputClass}`}
                  >
                    <option value="">Select Priority...</option>
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleUpdatePriority}
                    disabled={updatingPriority || !selectedPriority}
                    className="w-full rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingPriority ? "Updating..." : "Update Priority"}
                  </button>
                </div>

                <div className="space-y-2">
                  <p
                    className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    STATUS
                  </p>
                  <p className="text-sm">{ticket.status}</p>
                </div>

                <div className="space-y-2">
                  <p
                    className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    CREATED
                  </p>
                  <p className="text-xs">
                    {new Date(ticket.createdDate).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Admin Notes
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDark ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-700"}`}
                    >
                      Count: {notes.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {isNotesLoading ? (
                      <p
                        className={`text-xs text-center ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        Loading notes...
                      </p>
                    ) : notes.length === 0 ? (
                      <p
                        className={`text-xs text-center ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        No notes yet
                      </p>
                    ) : (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className={`rounded-lg border-l-4 border-amber-500 px-2 py-1.5 text-xs ${isDark ? "bg-amber-600/10" : "bg-amber-50"}`}
                        >
                          <p className="font-semibold mb-0.5">
                            {note.admin?.name || "Admin"}
                          </p>
                          {editingNoteId === note.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingNoteText}
                                onChange={(e) =>
                                  setEditingNoteText(e.target.value)
                                }
                                className={`w-full h-14 rounded-md border px-2 py-1 text-xs outline-none resize-none ${inputClass}`}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveNote}
                                  disabled={
                                    isSavingNote || !editingNoteText.trim()
                                  }
                                  className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                                >
                                  {isSavingNote ? "Saving..." : "Save"}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingNoteId("");
                                    setEditingNoteText("");
                                  }}
                                  className="rounded-md bg-slate-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-slate-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p>{note.message}</p>
                              <div className="mt-1 flex gap-2">
                                <button
                                  onClick={() => handleStartEditNote(note)}
                                  className="rounded-md bg-amber-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-500"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  disabled={deletingNoteId === note.id}
                                  className="rounded-md bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                                >
                                  {deletingNoteId === note.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add admin note..."
                      className={`w-full h-16 rounded-md border px-2 py-1 text-xs outline-none resize-none ${inputClass}`}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="w-full rounded-md bg-amber-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500"
                    >
                      Add Note
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Draft Panel */}
            {activePanel === "draft" && aiDraft && (
              <div className="flex-1 flex flex-col gap-3 p-4 overflow-hidden">
                <div className="space-y-2">
                  <p
                    className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    AI-GENERATED DRAFT
                  </p>
                  <p
                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Review and edit the AI-generated response before sending to
                    the author.
                  </p>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                  {isEditingDraft ? (
                    <textarea
                      value={editedDraft}
                      onChange={(e) => setEditedDraft(e.target.value)}
                      className={`flex-1 rounded-md border px-3 py-2 text-xs outline-none resize-none ${inputClass}`}
                      placeholder="Edit the draft here..."
                    />
                  ) : (
                    <div
                      className={`flex-1 overflow-y-auto rounded-md border p-3 text-xs ${
                        isDark
                          ? "border-slate-700 bg-slate-950"
                          : "border-slate-300 bg-slate-50"
                      }`}
                    >
                      {editedDraft || aiDraft}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {isEditingDraft ? (
                    <>
                      <button
                        onClick={() => setIsEditingDraft(false)}
                        disabled={isSendingDraft}
                        className="flex-1 rounded-md bg-amber-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
                      >
                        Done Editing
                      </button>
                      <button
                        onClick={() => {
                          setEditedDraft(aiDraft);
                          setIsEditingDraft(false);
                        }}
                        disabled={isSendingDraft}
                        className="flex-1 rounded-md bg-slate-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-500 disabled:opacity-50"
                      >
                        Reset
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditingDraft(true)}
                        disabled={isSendingDraft}
                        className="flex-1 rounded-md bg-blue-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleSendDraft}
                        disabled={isSendingDraft || !editedDraft.trim()}
                        className="flex-1 rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingDraft ? "Sending..." : "Send Draft"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* LLM Chat Panel */}
            {activePanel === "llm" && (
              <div className="flex-1 flex flex-col gap-3 p-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-2">
                  {llmChat.length === 0 ? (
                    <p
                      className={`text-xs text-center ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Ask LLM for analysis
                    </p>
                  ) : (
                    llmChat.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs rounded-lg px-2 py-1.5 text-xs ${
                            msg.role === "user"
                              ? isDark
                                ? "bg-purple-600/40 text-purple-100"
                                : "bg-purple-100 text-purple-900"
                              : isDark
                                ? "bg-slate-700 text-slate-100"
                                : "bg-slate-200 text-slate-900"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2 border-t pt-3">
                  <input
                    value={llmInput}
                    onChange={(e) => setLlmInput(e.target.value)}
                    placeholder="Ask LLM..."
                    className={`w-full rounded-md border px-2 py-1 text-xs outline-none ${inputClass}`}
                    onKeyPress={(e) => e.key === "Enter" && handleLlmChat()}
                  />
                  <button
                    onClick={handleLlmChat}
                    className="w-full rounded-md bg-purple-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-500"
                  >
                    Send to LLM
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
