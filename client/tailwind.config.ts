import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        surface: {
          bg: '#F8FAFC',
          sidebar: '#FFFFFF',
          card: '#FFFFFF',
          border: '#E2E8F0',
          subtle: '#F1F5F9',
        },
        metric: {
          cyan: {
            bg: '#ECFEFF',
            border: '#A5F3FC',
            text: '#0891B2',
            badge: '#CFFAFE',
          },
          peach: {
            bg: '#FFF7ED',
            border: '#FFEDD5',
            text: '#EA580C',
            badge: '#FFEDD5',
          },
          green: {
            bg: '#F0FDF4',
            border: '#BBF7D0',
            text: '#16A34A',
            badge: '#DCFCE7',
          },
          blue: {
            bg: '#EFF6FF',
            border: '#BFDBFE',
            text: '#2563EB',
            badge: '#DBEAFE',
          },
          purple: {
            bg: '#FAF5FF',
            border: '#E9D5FF',
            text: '#9333EA',
            badge: '#F3E8FF',
          },
        },
        attendance: {
          present: {
            bg: '#ECFDF5',
            text: '#065F46',
            border: '#A7F3D0',
            dot: '#10B981',
          },
          late: {
            bg: '#FFFBEB',
            text: '#92400E',
            border: '#FDE68A',
            dot: '#F59E0B',
          },
          absent: {
            bg: '#FEF2F2',
            text: '#991B1B',
            border: '#FECACA',
            dot: '#EF4444',
          },
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
