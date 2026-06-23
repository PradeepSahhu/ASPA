import { useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { AuthorDashboardPage } from "./pages/author-dashboard.jsx";
import { AdminDashboardPage } from "./pages/admin-dashboard.jsx";
import { TicketDetailPage } from "./pages/ticket-detail.jsx";
import { ThemeToggle } from "./components/theme-toggle.jsx";

function HomePage({ isDark, onToggleTheme }) {
  const pageClass = isDark
    ? "bg-[radial-gradient(circle_at_12%_12%,#12314f_0%,#06080d_52%)] text-slate-100"
    : "bg-[radial-gradient(circle_at_12%_12%,#dbeafe_0%,#f8fafc_52%)] text-slate-900";

  const cardClass = isDark
    ? "border-slate-700/70 bg-slate-900/85 text-slate-100"
    : "border-slate-200 bg-white/90 text-slate-900";

  const inputClass = isDark
    ? "border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-500"
    : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400";

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isAdmin ? "/admin/login" : "/author/login";

    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.data));
      localStorage.setItem("role", isAdmin ? "admin" : "author");
      navigate(isAdmin ? "/admin-dashboard" : "/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen px-4 py-8 sm:px-6 ${pageClass}`}>
      <div className="absolute right-4 top-4 flex gap-2 sm:right-6 sm:top-6">
        <ThemeToggle isDark={isDark} onToggleTheme={onToggleTheme} />
        <button
          onClick={() => {
            setIsAdmin(!isAdmin);
            setCredentials({ email: "", password: "" });
            setError("");
          }}
          className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          {isAdmin ? "Switch to Author" : "Admin Login"}
        </button>
      </div>

      <section
        className={`mx-auto mt-16 flex w-full max-w-md flex-col rounded-2xl border p-6 text-left shadow-2xl backdrop-blur sm:mt-20 sm:p-7 ${cardClass}`}
      >
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {isAdmin ? "Admin Login" : "Author Login"}
        </h1>
        <p
          className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          Welcome to your chat frontend. Please login to continue.
        </p>

        <form onSubmit={handleLogin} className="mt-5 flex flex-col gap-3">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={credentials.email}
            onChange={handleInputChange}
            required
            className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 ${inputClass}`}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleInputChange}
            required
            className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 ${inputClass}`}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-linear-to-r from-blue-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading
              ? "Logging in..."
              : `${isAdmin ? "Admin" : "Author"} Login`}
          </button>
        </form>
      </section>
    </div>
  );
}

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });

  const handleToggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };

  return (
    <div className="min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage isDark={isDark} onToggleTheme={handleToggleTheme} />
            }
          />
          <Route
            path="/dashboard"
            element={
              <AuthorDashboardPage
                isDark={isDark}
                onToggleTheme={handleToggleTheme}
              />
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <AdminDashboardPage
                isDark={isDark}
                onToggleTheme={handleToggleTheme}
              />
            }
          />
          <Route
            path="/:ticketId"
            element={
              <TicketDetailPage
                isDark={isDark}
                onToggleTheme={handleToggleTheme}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
