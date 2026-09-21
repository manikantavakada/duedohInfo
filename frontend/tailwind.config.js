/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#fffaf4",
        navy: "#1b3a5c",
        orange: "#c2410c",
        "orange-soft": "#fff1e8",
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
        display: ['"Baloo 2"', 'Inter', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};
