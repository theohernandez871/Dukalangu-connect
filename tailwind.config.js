/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
          400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
          800: '#065f46', 900: '#064e3b', 950: '#022c22',
        },
        accent: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a',
        },
        info: { 500: '#0ea5e9', 600: '#0284c7' },
        success: { 500: '#22c55e', 600: '#16a34a' },
        danger: { 500: '#ef4444', 600: '#dc2626' },
        warning: { 500: '#f97316', 600: '#ea580c' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(0,0,0,0.08), 0 4px 16px -4px rgba(0,0,0,0.06)',
        'soft-lg': '0 8px 24px -4px rgba(0,0,0,0.12), 0 16px 40px -8px rgba(0,0,0,0.08)',
        glass: '0 8px 32px 0 rgba(0,0,0,0.12)',
      },
      backdropBlur: { xs: '2px' },
      borderRadius: { xl: '1rem', '2xl': '1.25rem' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}
