import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:3000";

export function AuthorDashboardPage() {
  const [books, setBooks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    header: "",
    description: "",
    bookId: "",
  });
  const [ticketError, setTicketError] = useState("");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchBooks();
    fetchTickets();
  }, []);

  const fetchBooks = async () => {
    setLoadingBooks(true);
    try {
      const res = await fetch(`${API}/book/getBooks`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setBooks(data.data || []);
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch(`${API}/ticket/getTickets`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setTickets(data.data || []);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleTicketInput = (e) => {
    const { name, value } = e.target;
    setTicketForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    setTicketError("");
    setTicketSubmitting(true);
    try {
      const body = {
        header: ticketForm.header,
        description: ticketForm.description,
        ...(ticketForm.bookId && { bookId: ticketForm.bookId }),
      };
      const res = await fetch(`${API}/ticket/createTicket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setTicketError(data.message || "Failed to create ticket");
        return;
      }
      setTickets((prev) => [data.data, ...prev]);
      setTicketForm({ header: "", description: "", bookId: "" });
      setShowTicketForm(false);
    } catch (err) {
      setTicketError(err.message || "Something went wrong");
    } finally {
      setTicketSubmitting(false);
    }
  };

  const statusColor = (status) => {
    if (status === "OPEN") return "#40c057";
    if (status === "CLOSED") return "#adb5bd";
    return "#fab005";
  };

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        minHeight: "100vh",
        background: "#f8f9fa",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#fff",
          padding: "14px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #dee2e6",
        }}
      >
        <h2 style={{ margin: 0 }}>Author Dashboard</h2>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ color: "#495057" }}>
            {user.name || user.email || "Author"}
          </span>
          <button
            onClick={() => navigate("/chat")}
            style={{
              padding: "6px 14px",
              background: "#4dabf7",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Chat
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
            style={{
              padding: "6px 14px",
              background: "#ff6b6b",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", gap: "24px", padding: "24px" }}>
        {/* Left: Books */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            borderRadius: "8px",
            padding: "20px",
            border: "1px solid #dee2e6",
          }}
        >
          <h3 style={{ margin: "0 0 16px" }}>My Books</h3>
          {loadingBooks ? (
            <p style={{ color: "#adb5bd" }}>Loading books...</p>
          ) : books.length === 0 ? (
            <p style={{ color: "#adb5bd" }}>No books found.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {books.map((book) => (
                <li
                  key={book.id}
                  style={{
                    padding: "12px",
                    marginBottom: "8px",
                    background: "#f1f3f5",
                    borderRadius: "6px",
                  }}
                >
                  <strong>{book.title}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: Tickets */}
        <div
          style={{
            width: "380px",
            flexShrink: 0,
            background: "#fff",
            borderRadius: "8px",
            padding: "20px",
            border: "1px solid #dee2e6",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h3 style={{ margin: 0 }}>My Tickets</h3>
            <button
              onClick={() => {
                setShowTicketForm(!showTicketForm);
                setTicketError("");
              }}
              style={{
                padding: "6px 14px",
                background: "#40c057",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showTicketForm ? "Cancel" : "+ Raise Ticket"}
            </button>
          </div>

          {/* New Ticket Form */}
          {showTicketForm && (
            <form
              onSubmit={handleRaiseTicket}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "16px",
                padding: "12px",
                background: "#f1f3f5",
                borderRadius: "6px",
              }}
            >
              <input
                name="header"
                placeholder="Ticket subject"
                value={ticketForm.header}
                onChange={handleTicketInput}
                required
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ced4da",
                }}
              />
              <textarea
                name="description"
                placeholder="Describe your issue..."
                value={ticketForm.description}
                onChange={handleTicketInput}
                required
                rows={3}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ced4da",
                  resize: "vertical",
                }}
              />
              <select
                name="bookId"
                value={ticketForm.bookId}
                onChange={handleTicketInput}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ced4da",
                }}
              >
                <option value="">No book (optional)</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
              {ticketError && (
                <p style={{ color: "red", margin: 0, fontSize: "13px" }}>
                  {ticketError}
                </p>
              )}
              <button
                type="submit"
                disabled={ticketSubmitting}
                style={{
                  padding: "8px",
                  background: "#4dabf7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {ticketSubmitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </form>
          )}

          {/* Tickets List */}
          {loadingTickets ? (
            <p style={{ color: "#adb5bd" }}>Loading tickets...</p>
          ) : tickets.length === 0 ? (
            <p style={{ color: "#adb5bd" }}>No tickets raised yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  onClick={() => navigate(`/${ticket.id}`)}
                  style={{
                    padding: "12px",
                    marginBottom: "8px",
                    background: "#f1f3f5",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#e9ecef")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#f1f3f5")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong style={{ fontSize: "14px" }}>
                      {ticket.header}
                    </strong>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: statusColor(ticket.status),
                        color: "#fff",
                      }}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  {ticket.category && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "12px",
                        color: "#868e96",
                      }}
                    >
                      {ticket.category}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
