/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pagecraft: {
          50: '#f0fdf4',
          500: '#10b981',
          600: '#059669',
        },
        tech: {
          dark: '#0b0f19',
          card: '#111827',
          cardHover: '#1f2937',
          border: '#1e293b',
          borderActive: '#3b82f6',
          accent: '#06b6d4',
          purple: '#8b5cf6',
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
