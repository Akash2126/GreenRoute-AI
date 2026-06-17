/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#00D4AA', dark: '#00A886', light: '#00FFD1' },
        accent: { DEFAULT: '#00FF88', dim: '#00CC6A' },
        navy: { DEFAULT: '#0A0F1E', light: '#0F1629', card: '#111827' },
        glass: 'rgba(255,255,255,0.05)',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      backgroundImage: {
        'green-gradient': 'linear-gradient(135deg, #00D4AA 0%, #00FF88 100%)',
        'dark-gradient': 'linear-gradient(135deg, #0A0F1E 0%, #0F1629 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(0,212,170,0.1) 0%, rgba(0,255,136,0.05) 100%)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'draw-line': 'drawLine 2s ease-in-out forwards',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        pulseGreen: { '0%,100%': { boxShadow: '0 0 0 0 rgba(0,212,170,0.4)' }, '50%': { boxShadow: '0 0 0 10px rgba(0,212,170,0)' } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        drawLine: { from: { strokeDashoffset: '1000' }, to: { strokeDashoffset: '0' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backdropBlur: { glass: '20px' },
    },
  },
  plugins: [],
}
