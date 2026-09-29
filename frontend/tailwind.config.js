const { nextui } = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {}
    },
  },
  darkMode: "class",
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
            background: "#F8FAFC",
            foreground: "#0F172A",
            divider: "#E2E8F0",
            content1: "#FFFFFF",
            primary: {
              DEFAULT: "#3B82F6",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#14B8A6",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#10B981",
              foreground: "#FFFFFF",
            },
            warning: {
              DEFAULT: "#F59E0B",
              foreground: "#FFFFFF",
            },
            danger: {
              DEFAULT: "#EF4444",
              foreground: "#FFFFFF",
            },
          }
        },
        dark: {
          colors: {
            background: "#0F172A",
            foreground: "#F8FAFC",
            divider: "#334155",
            content1: "#1E293B",
            primary: {
              DEFAULT: "#3B82F6",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#14B8A6",
              foreground: "#FFFFFF",
            },
            success: {
              DEFAULT: "#10B981",
              foreground: "#FFFFFF",
            },
            warning: {
              DEFAULT: "#F59E0B",
              foreground: "#FFFFFF",
            },
            danger: {
              DEFAULT: "#EF4444",
              foreground: "#FFFFFF",
            },
          }
        }
      }
    })
  ],
};
