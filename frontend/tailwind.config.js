import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wassal: {
          green: "#53DD6C",
          "green-ink": "#1B872E",
          sage: "#63A088",
          "sage-deep": "#4B7B68",
          slate: "#56638A",
          plum: "#483A58",
          wine: "#56203D",
          ink: "#1A1A1A",
          bg: "#FAFAF9",
          surface: "#FFFFFF",
          border: "#E4E2E8",
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
