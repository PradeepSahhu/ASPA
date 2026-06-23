import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../components/theme-toggle.jsx";

const API = "http://localhost:3000";

const statusColor = (status) => {
  if (status === "OPEN") return "bg-emerald-600";
  if (status === "CLOSED") return "bg-slate-500";
  return "bg-amber-500";
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

const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

const PRIORITIES = [
  { value: 4, label: "Critical" },
  { value: 3, label: "High" },
  { value: 2, label: "Medium" },
  { value: 1, label: "Low" },
];

export function AdminDashboardPage({ isDark, onToggleTheme }) {
  const shellClass = isDark
    ? "bg-[radial-gradient(circle_at_top_left,#12314f_0%,#06080d_58%)] text-slate-100"
    : "bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#f8fafc_58%)] text-slate-900";
  const panelClass = isDark
    ? "border-slate-700/70 bg-slate-900/80"
    : "border-slate-200 bg-white/90";
  const inputClass = isDark
    ? "border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-400"
    : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-500";

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
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

  const filtered = tickets
    .filter((t) => {
      const matchesSearch =
        t.header.toLowerCase().includes(search.toLowerCase()) ||
        t.author?.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.author?.email?.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = !categoryFilter || t.category === categoryFilter;
      const matchesPriority =
        !priorityFilter || t.priorityScore === parseInt(priorityFilter);

      return matchesSearch && matchesCategory && matchesPriority;
    })
    .sort((left, right) => {
      const priorityDiff =
        (right.priorityScore || 0) - (left.priorityScore || 0);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return new Date(right.createdDate) - new Date(left.createdDate);
    });

  return (
    <div className={`min-h-screen ${shellClass}`}>
      <header
        className={`border-b px-4 py-3 backdrop-blur sm:px-7 ${panelClass}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Admin Dashboard</h2>
          <div className="flex items-center gap-2">
            <ThemeToggle isDark={isDark} onToggleTheme={onToggleTheme} />
            <span
              className={`hidden text-sm sm:inline ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
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
        <section className={`rounded-xl border p-5 shadow-xl ${panelClass}`}>
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">All Tickets</h3>
              <button
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("");
                  setPriorityFilter("");
                }}
                className={`text-xs px-2 py-1 rounded transition ${isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"}`}
              >
                Clear Filters
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search by subject or author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`flex-1 min-w-64 rounded-md border px-3 py-2 text-sm outline-none transition focus:border-blue-500 ${inputClass}`}
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`rounded-md border px-3 py-2 text-sm outline-none transition focus:border-blue-500 ${inputClass}`}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={`rounded-md border px-3 py-2 text-sm outline-none transition focus:border-blue-500 ${inputClass}`}
              >
                <option value="">All Priorities</option>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className={isDark ? "text-slate-400" : "text-slate-600"}>
              Loading tickets...
            </p>
          ) : filtered.length === 0 ? (
            <p className={isDark ? "text-slate-400" : "text-slate-600"}>
              No tickets found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr
                    className={`border-b text-xs uppercase tracking-wider ${isDark ? "border-slate-700 bg-slate-800/80 text-slate-300" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                  >
                    <th className="px-3 py-2">Subject</th>
                    <th className="px-3 py-2">Author</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => navigate(`/${ticket.id}`)}
                      className={`cursor-pointer border-b transition ${isDark ? "border-slate-800 hover:bg-slate-800/70" : "border-slate-200 hover:bg-slate-100"}`}
                    >
                      <td className="px-3 py-3">{ticket.header}</td>
                      <td className="px-3 py-3">
                        {ticket.author?.name || "—"}
                      </td>
                      <td className="px-3 py-3">
                        {ticket.author?.email || "—"}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {ticket.category || "—"}
                      </td>
                      <td className="px-3 py-3">
                        {ticket.priorityScore ? (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] text-white ${priorityColor(ticket.priorityScore)}`}
                          >
                            {priorityLabel(ticket.priorityScore)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] text-white ${statusColor(ticket.status)}`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td
                        className={`px-3 py-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
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
