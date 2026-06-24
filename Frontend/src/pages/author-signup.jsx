import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function AuthorSignupPage({ isDark, onToggleTheme }) {
  const pageClass = isDark
    ? "bg-[radial-gradient(circle_at_18%_10%,#16345a_0%,#070b12_55%)] text-slate-100"
    : "bg-[radial-gradient(circle_at_18%_10%,#dbeafe_0%,#f8fafc_55%)] text-slate-900";

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
    phone_no: "",
    city: "",
    account_no: "",
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
      const response = await fetch(`${API}/author/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Author signup failed");
        return;
      }

      setSuccess("Account created successfully. Redirecting to login...");
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
          className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500"
        >
          Toggle Theme
        </button>
      </div>

      <section
        className={`mx-auto mt-8 flex w-full max-w-lg flex-col rounded-2xl border p-6 text-left shadow-2xl backdrop-blur sm:mt-12 sm:p-7 ${cardClass}`}
      >
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Author Sign Up
        </h1>
        <p
          className={`mt-2 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          Create your author account to access your publishing dashboard.
        </p>

        <form
          onSubmit={handleSignup}
          className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleInputChange}
            required
            className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 sm:col-span-2 ${inputClass}`}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 sm:col-span-2 ${inputClass}`}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 sm:col-span-2 ${inputClass}`}
          />
          <input
            type="text"
            name="phone_no"
            placeholder="Phone Number"
            value={formData.phone_no}
            onChange={handleInputChange}
            className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 ${inputClass}`}
          />
          <input
            type="text"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleInputChange}
            className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 ${inputClass}`}
          />
          <input
            type="text"
            name="account_no"
            placeholder="Account Number"
            value={formData.account_no}
            onChange={handleInputChange}
            className={`rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 sm:col-span-2 ${inputClass}`}
          />

          {error && (
            <p className="text-sm text-red-400 sm:col-span-2">{error}</p>
          )}
          {success && (
            <p className="text-sm text-emerald-400 sm:col-span-2">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-xl bg-linear-to-r from-blue-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-70 sm:col-span-2"
          >
            {loading ? "Creating account..." : "Create Author Account"}
          </button>
        </form>

        <p
          className={`mt-4 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          Already have an account?{" "}
          <Link
            to="/"
            className="font-semibold text-blue-500 hover:text-blue-400"
          >
            Login here
          </Link>
        </p>
      </section>
    </div>
  );
}
