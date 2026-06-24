import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function AdminSignupPage({ isDark, onToggleTheme }) {
  const pageClass = isDark
    ? "bg-[radial-gradient(circle_at_20%_12%,#2f1f4f_0%,#08070f_55%)] text-slate-100"
    : "bg-[radial-gradient(circle_at_20%_12%,#fee2e2_0%,#fff7ed_55%)] text-slate-900";

  const cardClass = isDark
    ? "border-slate-700/70 bg-slate-900/85 text-slate-100"
    : "border-slate-200 bg-white/90 text-slate-900";

  const inputClass = isDark
    ? "border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-500"
    : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400";

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    contact_info: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/admin/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Admin signup failed");
        return;
      }

      setSuccess("Admin account created successfully. Redirecting to login...");
      setTimeout(() => {
        navigate("/");
      }, 900);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen px-4 py-8 sm:px-6 ${pageClass}`}>
      <div className="absolute right-4 top-4 flex gap-2 sm:right-6 sm:top-6">
        <button
          onClick={onToggleTheme}
          className="rounded-full bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-500"
        >
          Toggle Theme
        </button>
      </div>

      <section
        className={`mx-auto mt-12 flex w-full max-w-md flex-col rounded-2xl border p-6 text-left shadow-2xl backdrop-blur sm:mt-20 sm:p-7 ${cardClass}`}
      >
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Admin Sign Up
        </h1>
        <p
          className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          Register an admin account to manage tickets and operations.
        </p>

        <form onSubmit={handleSignup} className="mt-5 flex flex-col gap-3">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleInputChange}
            required
            className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 ${inputClass}`}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 ${inputClass}`}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 ${inputClass}`}
          />
          <input
            type="text"
            name="contact_info"
            placeholder="Contact Info"
            value={formData.contact_info}
            onChange={handleInputChange}
            className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 ${inputClass}`}
          />

          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-emerald-400">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-xl bg-linear-to-r from-orange-600 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-orange-500 hover:to-rose-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Create Admin Account"}
          </button>
        </form>

        <p
          className={`mt-4 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          Already have an account?{" "}
          <Link
            to="/"
            className="font-semibold text-orange-500 hover:text-orange-400"
          >
            Login here
          </Link>
        </p>
      </section>
    </div>
  );
}
