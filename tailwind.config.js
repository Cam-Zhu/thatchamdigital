/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.html"],
  theme: {
    extend: {
      colors: {
        ivory: "#FCFAF3",
        cream: "#F4EFE7",
        slate: "#264653",
        peach: "#F4A261",
        wheat: "#F9DDA4",
        aqua: "#A8DADC",
        river: "#457B9D",
        ink: "#4A4A4A",
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Karla', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: {
        prose: '38rem',
      },
    },
  },
  plugins: [],
};
