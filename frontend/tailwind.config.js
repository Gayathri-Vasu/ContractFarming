/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        earth: {
          50: '#faf5f0',
          100: '#f5e6d3',
          200: '#ebccb0',
          300: '#d4a574',
          400: '#b8864f',
          500: '#9d6b3a',
          600: '#7d5430',
          700: '#5d3f25',
          800: '#3d2a1a',
          900: '#1d150d',
        }
      },
    },
  },
  plugins: [],
}







