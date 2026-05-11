/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Semantic colors mapped to the CSS variables set live by the theme switcher.
      // The 5 themes (arena, niebla, carbon, papel, lino) just rewrite these vars.
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        muted: "var(--muted)",
        "muted-2": "var(--muted-2)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        info: "var(--info)",
        "info-soft": "var(--info-soft)",
        warn: "var(--warn)",
        "warn-soft": "var(--warn-soft)",
        danger: "var(--danger)",
        "danger-soft": "var(--danger-soft)",
      },
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
      },
      // Keyframes + .anim-* classes live in src/index.css — see the note there
      // for why they can't be Tailwind-generated.
    },
  },
  plugins: [],
};
