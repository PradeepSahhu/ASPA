export function ThemeToggle({ isDark, onToggleTheme, className = "" }) {
  return (
    <button
      type="button"
      onClick={onToggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
      className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-semibold transition ${
        isDark
          ? "border-emerald-400/50 bg-slate-900 text-slate-100 hover:bg-slate-800"
          : "border-blue-300 bg-white text-slate-800 hover:bg-slate-100"
      } ${className}`}
    >
      <span className={isDark ? "text-slate-300" : "text-slate-500"}>
        Light
      </span>
      <span
        className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${
          isDark ? "bg-emerald-500" : "bg-blue-500"
        }`}
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-white transition-transform ${
            isDark ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </span>
      <span className={isDark ? "text-slate-100" : "text-slate-700"}>Dark</span>
    </button>
  );
}
