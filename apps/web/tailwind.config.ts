import type { Config } from 'tailwindcss'

/**
 * Design tokens for AplicoCV (Phase 2).
 * Restrained palette: deep navy primary, electric blue accent, near-white backgrounds.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef1f8',
          100: '#d3daed',
          200: '#a7b5db',
          300: '#7b90c9',
          400: '#4f6bb7',
          500: '#34508f',
          600: '#283e70',
          700: '#1d2d52',
          800: '#131d35',
          900: '#0b1426',
          950: '#070d1a',
        },
        electric: {
          50: '#e8f3ff',
          100: '#cce4ff',
          200: '#99c9ff',
          300: '#66adff',
          400: '#3392ff',
          500: '#0a74f0',
          600: '#085cc0',
          700: '#064591',
          800: '#042e61',
          900: '#021730',
        },
        violet: {
          50: '#f3f0ff',
          100: '#e7e0ff',
          200: '#cfc0ff',
          300: '#b29bff',
          400: '#8f6cff',
          500: '#7341ff',
          600: '#5f29e6',
          700: '#4d1fbd',
          800: '#3c1a91',
          900: '#2a1466',
        },
        cyan: {
          50: '#e6fbff',
          100: '#c7f4ff',
          200: '#92e9ff',
          300: '#54d7ff',
          400: '#1fbef0',
          500: '#04a0d4',
          600: '#017fab',
          700: '#076184',
          800: '#0c4f6b',
          900: '#0f425a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(11, 20, 38, 0.06), 0 1px 2px rgba(11, 20, 38, 0.04)',
        'card-hover': '0 20px 48px -12px rgba(11, 20, 38, 0.18)',
        glow: '0 0 0 1px rgba(51,146,255,0.18), 0 12px 40px -8px rgba(51,146,255,0.45)',
        'glow-violet': '0 0 0 1px rgba(143,108,255,0.2), 0 12px 40px -8px rgba(115,65,255,0.4)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(110deg, #0a74f0 0%, #7341ff 50%, #1fbef0 100%)',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'gradient-mesh': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        ticker: 'ticker 30s linear infinite',
        'gradient-mesh': 'gradient-mesh 18s ease infinite',
        'gradient-pan': 'gradient-pan 6s ease infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
