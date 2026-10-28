import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#041a24",
        bg: "var(--bg)",
        "bg-raised": "var(--bg-raised)",
        "bg-hover": "var(--bg-hover)",
        "bg-subtle": "var(--bg-subtle)",
        fg: "var(--fg)",
        "fg-muted": "var(--fg-muted)",
        "fg-subtle": "var(--fg-subtle)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        "border-hover": "var(--border-hover)",
        brand: "#041a24",
      },
      fontFamily: {
        editorial: ["var(--font-editorial)", "Newsreader", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Geist Sans", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "Geist Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        editorial: "0.18em",
      },
      borderRadius: {
        DEFAULT: "2px",
        sm: "2px",
        md: "3px",
        lg: "4px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
