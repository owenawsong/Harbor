/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        harbor: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bbfc',
          400: '#8b9ff8',
          500: '#6b7ff3',
          600: '#4f5fe8',
          700: '#3d4bd6',
          800: '#3240ad',
          900: '#2d3888',
        },
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 80%, 100%': { opacity: '0' },
          '40%':           { opacity: '1' },
        },
        cursorBlink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up':      'fadeUp 0.2s ease-out both',
        'fade-in':      'fadeIn 0.15s ease-out both',
        'slide-down':   'slideDown 0.15s ease-out both',
        'blink':        'blink 1.4s ease-in-out infinite',
        'cursor-blink': 'cursorBlink 0.8s ease-in-out infinite',
        'spin':         'spin 0.8s linear infinite',
      },
    },
  },
  plugins: [],
}
