/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        tg: {
          bg: "var(--tg-theme-bg-color, #ffffff)",
          text: "var(--tg-theme-text-color, #000000)",
          hint: "var(--tg-theme-hint-color, #999999)",
          link: "var(--tg-theme-link-color, #2481cc)",
          button: "var(--tg-theme-button-color, #2481cc)",
          "button-text": "var(--tg-theme-button-text-color, #ffffff)",
          "secondary-bg": "var(--tg-theme-secondary-bg-color, #f0f0f0)",
          "header-bg": "var(--tg-theme-header-bg-color, #ffffff)",
          accent: "var(--tg-theme-accent-text-color, #2481cc)",
          section: "var(--tg-theme-section-bg-color, #ffffff)",
          "section-header":
            "var(--tg-theme-section-header-text-color, #000000)",
          subtitle: "var(--tg-theme-subtitle-text-color, #666666)",
          destructive:
            "var(--tg-theme-destructive-text-color, #e53935)",
        },
      },
      fontFamily: {
        persian: ["AnjomanMaxA", "Tahoma", "Arial", "sans-serif"],
      },
      animation: {
        "countdown-pulse": "pulse 1s ease-in-out infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(255, 107, 53, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(255, 107, 53, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
