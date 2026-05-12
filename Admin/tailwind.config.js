/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        background: "hsl(40, 20%, 97%)",
        foreground: "hsl(150, 30%, 12%)",

        card: "hsl(0, 0%, 100%)",
        "card-foreground": "hsl(150, 30%, 12%)",

        popover: "hsl(0, 0%, 100%)",
        "popover-foreground": "hsl(150, 30%, 12%)",

        primary: {
          DEFAULT: "hsl(145, 45%, 28%)",
          foreground: "hsl(40, 20%, 97%)",
        },

        secondary: {
          DEFAULT: "hsl(35, 60%, 52%)",
          foreground: "hsl(0, 0%, 100%)",
        },

        muted: {
          DEFAULT: "hsl(40, 15%, 92%)",
          foreground: "hsl(150, 10%, 45%)",
        },

        accent: {
          DEFAULT: "hsl(35, 80%, 55%)",
          foreground: "hsl(30, 50%, 15%)",
        },

        destructive: {
          DEFAULT: "hsl(0, 72%, 51%)",
          foreground: "hsl(0, 0%, 100%)",
        },

        border: "hsl(40, 15%, 88%)",
        input: "hsl(40, 15%, 88%)",
        ring: "hsl(145, 45%, 28%)",

        sidebar: {
          DEFAULT: "hsl(150, 30%, 18%)",
          foreground: "hsl(40, 20%, 90%)",

          primary: "hsl(38, 80%, 55%)",
          "primary-foreground": "hsl(150, 35%, 12%)",

          accent: "hsl(150, 25%, 25%)",
          border: "hsl(150, 20%, 25%)",
          ring: "hsl(38, 80%, 55%)",
        },

        success: {
          DEFAULT: "hsl(145, 60%, 40%)",
          foreground: "hsl(0, 0%, 100%)",
        },

        warning: {
          DEFAULT: "hsl(40, 90%, 50%)",
          foreground: "hsl(30, 50%, 15%)",
        },

        info: {
          DEFAULT: "hsl(200, 70%, 50%)",
          foreground: "hsl(0, 0%, 100%)",
        },

        chart: {
          1: "hsl(145, 45%, 28%)",
          2: "hsl(35, 80%, 55%)",
          3: "hsl(200, 70%, 50%)",
          4: "hsl(0, 72%, 51%)",
          5: "hsl(280, 60%, 50%)",
        },
      },

      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },

      borderRadius: {
        xl: "0.75rem",
      },

      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 4px 6px rgba(0,0,0,0.1)",
      },
    },
  },

  darkMode: "class",

  plugins: [],
};
