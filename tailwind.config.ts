import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#f16232",
          dark: "#d95225",
        },
        brand: {
          50:  "#fff3ed",
          100: "#ffe4d4",
          200: "#ffc4a8",
          300: "#ff9d71",
          400: "#ff6c34",
          500: "#f16232",
          600: "#e04514",
          700: "#bb300e",
          800: "#952610",
          900: "#782210",
          950: "#410e06",
        },
        accent: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        surface: {
          50:  "#ffffff",
          100: "#fafafa",
          200: "#f4f4f5",
          300: "#e4e4e7",
          400: "#d4d4d8",
          500: "#a1a1aa",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
        },
      },
      borderRadius: {
        DEFAULT: "12px",
        sm:  "8px",
        md:  "12px",
        lg:  "16px",
        xl:  "20px",
        "2xl": "24px",
        "3xl": "32px",
      },
      boxShadow: {
        xs:       "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        soft:     "0 4px 20px -2px rgb(0 0 0 / 0.05), 0 0 3px rgb(0 0 0 / 0.02)",
        card:     "0 8px 30px rgb(0 0 0 / 0.04)",
        elevated: "0 20px 40px -4px rgb(0 0 0 / 0.08), 0 8px 16px -4px rgb(0 0 0 / 0.04)",
        "glow-brand":    "0 0 0 3px rgb(241 98 50 / 0.15), 0 4px 14px 0 rgb(241 98 50 / 0.39)",
        "glow-brand-lg": "0 0 0 4px rgb(241 98 50 / 0.12), 0 8px 24px rgb(241 98 50 / 0.35)",
        dropdown: "0 10px 30px -4px rgb(0 0 0 / 0.1), 0 4px 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":  "spin 4s linear infinite",
        "float":      "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 3s infinite",
        "slide-in":   "slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-up":    "fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pop-in":     "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "wave":       "wave 0.8s ease-in-out infinite",
      },
      keyframes: {
        float:  { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
        slideIn:{ from: { opacity: "0", transform: "translateX(-12px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        fadeUp: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        popIn:  { from: { opacity: "0", transform: "scale(0.96)" }, to: { opacity: "1", transform: "scale(1)" } },
        wave:   { "0%, 100%": { transform: "scaleY(0.2)" }, "50%": { transform: "scaleY(1)" } },
      },
      backdropBlur: { xs: "2px", sm: "4px", md: "8px", lg: "12px", xl: "16px" },
      spacing: { "18": "4.5rem", "62": "15.5rem", "72": "18rem", "88": "22rem", "104": "26rem" },
    },
  },
  plugins: [],
};

export default config;
