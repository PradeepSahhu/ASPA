import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:3000";

const statusColor = (status) => {
  if (status === "OPEN") return "bg-emerald-600";
  if (status === "CLOSED") return "bg-slate-500";
  return "bg-amber-500";
};

export function AdminDashboardPage({ isDark, onToggleTheme }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/ticket/getAllTickets`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setTickets(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const filtered = tickets.filter(
    (t) =>
      t.header.toLowerCase().includes(search.toLowerCase()) ||
      t.author?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.author?.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#12314f_0%,#06080d_58%)] text-slate-100">
      <header className="border-b border-slate-700/70 bg-slate-900/80 px-4 py-3 backdrop-blur sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Admin Dashboard</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
            >
              {isDark ? "Light Theme" : "Black Theme"}
            </button>
            <span className="hidden text-sm text-slate-400 sm:inline">
              {user.name || user.email || "Admin"}
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

      <main className="p-4 sm:p-6">
        <section className="rounded-xl border border-slate-700/70 bg-slate-900/80 p-5 shadow-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">All Tickets</h3>
            <input
              type="text"
              placeholder="Search by subject or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-sm rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>

          {loading ? (
            <p className="text-slate-400">Loading tickets...</p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-400">No tickets found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/80 text-xs uppercase tracking-wider text-slate-300">
                    <th className="px-3 py-2">Subject</th>
                    <th className="px-3 py-2">Author</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => navigate(`/${ticket.id}`)}
                      className="cursor-pointer border-b border-slate-800 transition hover:bg-slate-800/70"
                    >
                      <td className="px-3 py-3">{ticket.header}</td>
                      <td className="px-3 py-3">
                        {ticket.author?.name || "—"}
                      </td>
                      <td className="px-3 py-3">
                        {ticket.author?.email || "—"}
                      </td>
                      <td className="px-3 py-3">{ticket.category || "—"}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] text-white ${statusColor(ticket.status)}`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-400">
                        {new Date(ticket.createdDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
