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
        theme: {
          background: 'rgb(var(--theme-background) / <alpha-value>)',
          surface: 'rgb(var(--theme-surface) / <alpha-value>)',
          card: 'rgb(var(--theme-card) / <alpha-value>)',
          'surface-muted': 'rgb(var(--theme-surface-muted) / <alpha-value>)',
          'text-primary': 'rgb(var(--theme-text-primary) / <alpha-value>)',
          'text-secondary': 'rgb(var(--theme-text-secondary) / <alpha-value>)',
          border: 'rgb(var(--theme-border) / <alpha-value>)',
          'card-bg': 'rgb(var(--card-background) / <alpha-value>)',
          'card-fg': 'rgb(var(--card-foreground) / <alpha-value>)',
          'hover-card-bg': 'rgb(var(--hover-card-background) / <alpha-value>)',
          'hover-card-fg': 'rgb(var(--hover-card-foreground) / <alpha-value>)',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#2e1065',
          950: '#1e0a3c',
        },
        // Brand colors are reserved for actions and data visualization.
        brand: {
          lightest: '#F8FAFC',
          lighter: '#F1F5F9',
          light: '#E2E8F0',
          accent: '#3B82F6',
          secondary: '#7C3AED',
          text: '#1E293B',
          textSecondary: '#64748B',
        },
        accent: {
          blue: '#3B82F6',
          purple: '#7C3AED',
          cyan: '#06b6d4',
          emerald: '#10b981',
        },
        light: {
          bg: 'rgb(var(--theme-background) / <alpha-value>)',
          card: 'rgb(var(--theme-card) / <alpha-value>)',
          border: 'rgb(var(--theme-border) / <alpha-value>)',
          text: 'rgb(var(--theme-text-primary) / <alpha-value>)',
          textSecondary: 'rgb(var(--theme-text-secondary) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(59, 130, 246, 0.15)',
        'glow-primary-md': '0 0 30px rgba(59, 130, 246, 0.2)',
        'glow-secondary': '0 0 20px rgba(124, 58, 237, 0.15)',
        // Updated for light mode with softer shadows
        'elevation-sm': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'elevation-md': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        'elevation-lg': '0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.04)',
        'glass-glow': '0 0 15px rgba(0, 0, 0, 0.03)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.15)' },
          '50%': { boxShadow: '0 0 30px rgba(14, 165, 233, 0.3)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-in-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      opacity: {
        '3': '0.03',
        '5': '0.05',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.glass': {
          '@apply bg-theme-surface border border-theme-border': '',
        },
        '.glass-elevated': {
          '@apply bg-theme-card border border-theme-border shadow-elevation-md': '',
        },
        '.glass-card': {
          '@apply bg-theme-card border border-theme-border shadow-elevation-sm hover:shadow-glow-primary transition-all duration-300': '',
        },
        '.border-glow': {
          'border-image': 'linear-gradient(to right, #3B82F6, #7C3AED) 1',
        },
        '.text-gradient': {
          '@apply bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500': '',
        }
      });
    },
  ],
}
