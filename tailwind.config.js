/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        'apple-blue': {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#0A84FF', // iOS blue
          600: '#0975E4',
          700: '#0864C7',
          800: '#0754AB',
          900: '#063C7B',
        },
        'apple-gray': {
          50: '#F9FAFB',
          100: '#F2F4F6',
          200: '#E3E5E8',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        'apple-green': {
          500: '#34C759', // iOS green
        },
        'apple-red': {
          500: '#FF3B30', // iOS red
        },
        'apple-orange': {
          500: '#FF9500', // iOS orange
        },
        'apple-yellow': {
          500: '#FFCC00', // iOS yellow
        },
        'apple-purple': {
          500: '#AF52DE', // iOS purple
        },
        'apple-pink': {
          500: '#FF2D55', // iOS pink
        },
      },
      borderRadius: {
        'apple': '10px',
        'apple-xl': '20px',
        'apple-2xl': '28px',
      },
      boxShadow: {
        'apple': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'apple-md': '0 4px 8px -1px rgba(0, 0, 0, 0.07), 0 2px 6px -1px rgba(0, 0, 0, 0.05)',
        'apple-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'apple-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'apple-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        'apple-inset': 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-subtle': 'linear-gradient(to right, var(--tw-gradient-stops))',
        'grid-white': 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 0H0V1H1V0Z\' fill=\'white\'/%3E%3C/svg%3E")',
      },
    },
  },
  plugins: [],
}