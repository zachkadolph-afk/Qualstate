/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd6ff',
          300: '#8ebcff',
          400: '#5996ff',
          500: '#2f6df6',
          600: '#1c4fe0',
          700: '#193fb5',
          800: '#1a388f',
          900: '#1b3372',
          950: '#142149',
        },
        accent: {
          400: '#ff9a3c',
          500: '#ff7a18',
          600: '#ea6306',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,33,73,0.04), 0 8px 24px -12px rgba(16,33,73,0.18)',
        glow: '0 0 0 1px rgba(47,109,246,0.15), 0 12px 32px -12px rgba(47,109,246,0.35)',
      },
    },
  },
  plugins: [],
}
