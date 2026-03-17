/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif:  ['Cormorant Garamond', 'Georgia', 'Times New Roman', 'serif'],
        sans:   ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono:   ['JetBrains Mono', 'Fira Code', 'SF Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        harbor: {
          50:  '#f0f8fb',
          100: '#ddf0f6',
          200: '#b3e0ed',
          300: '#7fcde2',
          400: '#6ab4cc',
          500: '#4e8ea8',
          600: '#3d7a94',
          700: '#2d6278',
          800: '#1f4f63',
          900: '#0f3a4f',
          950: '#072435',
        },
        navy: {
          50:  '#eeeef5',
          100: '#d0d0e8',
          200: '#a6a6cf',
          300: '#7a7ab8',
          400: '#5353a0',
          500: '#2d2d88',
          600: '#1e1e6b',
          700: '#13134e',
          800: '#0d0d1a',
          900: '#07070e',
        },
        cream: {
          50:  '#fdfcfa',
          100: '#f9f8f4',
          200: '#ece9e2',
          300: '#ddd8cf',
          400: '#c8c0b3',
          500: '#b0a598',
          600: '#978a7c',
          700: '#7d6f62',
          800: '#625548',
          900: '#473d32',
        },
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
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
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        ripple: {
          '0%':   { transform: 'scale(0)', opacity: '0.6' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(78, 142, 168, 0.3)' },
          '50%':      { boxShadow: '0 0 16px 4px rgba(78, 142, 168, 0.6)' },
        },
        onboardReveal: {
          '0%':   { opacity: '0', transform: 'translateY(20px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        stepIn: {
          '0%':   { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        stepOut: {
          '0%':   { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(-24px)' },
        },
      },
      animation: {
        'fade-up':        'fadeUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-down':      'fadeDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':        'fadeIn 0.2s ease-out both',
        'scale-in':       'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down':     'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-right':    'slideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'blink':          'blink 1.4s ease-in-out infinite',
        'cursor-blink':   'cursorBlink 0.8s ease-in-out infinite',
        'spin':           'spin 0.8s linear infinite',
        'shimmer':        'shimmer 2s linear infinite',
        'pulse':          'pulse 2s ease-in-out infinite',
        'ripple':         'ripple 0.6s ease-out forwards',
        'glow':           'glow 2s ease-in-out infinite',
        'onboard-reveal': 'onboardReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'step-in':        'stepIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'step-out':       'stepOut 0.25s cubic-bezier(0.4, 0, 1, 1) both',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
