import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:3000";

export function AuthorDashboardPage({ isDark, onToggleTheme }) {
  const shellClass = isDark
    ? "bg-[radial-gradient(circle_at_top_left,#12314f_0%,#06080d_58%)] text-slate-100"
    : "bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#f8fafc_58%)] text-slate-900";
  const panelClass = isDark
    ? "border-slate-700/70 bg-slate-900/80"
    : "border-slate-200 bg-white/90";
  const subPanelClass = isDark
    ? "border-slate-700 bg-slate-800/70"
    : "border-slate-200 bg-slate-50";
  const inputClass = isDark
    ? "border-slate-600 bg-slate-900 text-slate-100"
    : "border-slate-300 bg-white text-slate-900";

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
    if (status === "OPEN") return "bg-emerald-600";
    if (status === "CLOSED") return "bg-slate-500";
    return "bg-amber-500";
  };

  return (
    <div className={`min-h-screen ${shellClass}`}>
      <header
        className={`border-b px-4 py-3 backdrop-blur sm:px-7 ${panelClass}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Author Dashboard</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white transition ${isDark ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500"}`}
            >
              {isDark ? "Light Theme" : "Black Theme"}
            </button>
            <span
              className={`hidden text-sm sm:inline ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              {user.name || user.email || "Author"}
            </span>
            <button
              onClick={() => {
                localStorage.clear();
                navigate("/");
              }}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-rose-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_380px]">
        <section className={`rounded-xl border p-5 shadow-xl ${panelClass}`}>
          <h3 className="mb-4 text-lg font-semibold">My Books</h3>
          {loadingBooks ? (
            <p className={isDark ? "text-slate-400" : "text-slate-600"}>
              Loading books...
            </p>
          ) : books.length === 0 ? (
            <p className={isDark ? "text-slate-400" : "text-slate-600"}>
              No books found.
            </p>
          ) : (
            <ul className="space-y-2">
              {books.map((book) => (
                <li
                  key={book.id}
                  className={`rounded-lg border px-3 py-2 ${subPanelClass}`}
                >
                  <strong>{book.title}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className={`rounded-xl border p-5 shadow-xl ${panelClass}`}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">My Tickets</h3>
            <button
              onClick={() => {
                setShowTicketForm(!showTicketForm);
                setTicketError("");
              }}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              {showTicketForm ? "Cancel" : "+ Raise Ticket"}
            </button>
          </div>

          {showTicketForm && (
            <form
              onSubmit={handleRaiseTicket}
              className={`mb-4 space-y-2 rounded-lg border p-3 ${subPanelClass}`}
            >
              <input
                name="header"
                placeholder="Ticket subject"
                value={ticketForm.header}
                onChange={handleTicketInput}
                required
                className={`w-full rounded-md border px-2.5 py-2 text-sm outline-none transition focus:border-blue-500 ${inputClass}`}
              />
              <textarea
                name="description"
                placeholder="Describe your issue..."
                value={ticketForm.description}
                onChange={handleTicketInput}
                required
                rows={3}
                className={`w-full resize-y rounded-md border px-2.5 py-2 text-sm outline-none transition focus:border-blue-500 ${inputClass}`}
              />
              <select
                name="bookId"
                value={ticketForm.bookId}
                onChange={handleTicketInput}
                className={`w-full rounded-md border px-2.5 py-2 text-sm outline-none transition focus:border-blue-500 ${inputClass}`}
              >
                <option value="">No book (optional)</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
              {ticketError && (
                <p className="text-sm text-red-400">{ticketError}</p>
              )}
              <button
                type="submit"
                disabled={ticketSubmitting}
                className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {ticketSubmitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </form>
          )}

          {loadingTickets ? (
            <p className={isDark ? "text-slate-400" : "text-slate-600"}>
              Loading tickets...
            </p>
          ) : tickets.length === 0 ? (
            <p className={isDark ? "text-slate-400" : "text-slate-600"}>
              No tickets raised yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  onClick={() => navigate(`/${ticket.id}`)}
                  className={`cursor-pointer rounded-lg border p-3 transition hover:border-blue-500 ${subPanelClass} ${isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="line-clamp-1 text-sm">
                      {ticket.header}
                    </strong>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] text-white ${statusColor(ticket.status)}`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  {ticket.category && (
                    <p
                      className={`mt-1 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      {ticket.category}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </main>
    </div>
  );
}
