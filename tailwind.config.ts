import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        display: ['"Fraunces"', "serif"],
      },
      colors: {
        sage: {
          50: "#f6f7f4",
          100: "#e8ebe3",
          200: "#d3d9c8",
          300: "#b4bfa3",
          400: "#95a47e",
          500: "#788963",
          600: "#5e6d4d",
          700: "#4a563e",
          800: "#3d4634",
          900: "#343c2e",
        },
        cream: "#faf8f3",
        warm: {
          50: "#fdf8f0",
          100: "#f9eddb",
          200: "#f2d8b5",
          300: "#e9bd86",
          400: "#df9c55",
          500: "#d78333",
          600: "#c96c28",
          700: "#a75324",
          800: "#864324",
          900: "#6d3820",
        },
      },
    },
  },
  plugins: [],
};

export default config;
