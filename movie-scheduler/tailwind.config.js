/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        surface: '#18181b',
        surfaceHover: '#27272a',
        border: '#3f3f46',
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        textMain: '#f4f4f5',
        textMuted: '#a1a1aa'
      }
    },
  },
  plugins: [],
}
