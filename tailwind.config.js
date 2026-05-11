/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans SC', 'PingFang SC', 'sans-serif'],
        mono: ['Inter', 'Geist', 'monospace']
      },
      animation: {
        'fade-in': 'fadeIn 0.26s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-up': 'slideUp 0.26s cubic-bezier(0.34,1.56,0.64,1)',
        'pulse-slow': 'pulseSlow 2.5s ease-in-out infinite',
        breathe: 'breathe 3s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '0.15' }
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' }
        }
      }
    }
  },
  plugins: []
}
