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
        // Neutral steel — the "metal" of the embossed surfaces. Warm-gray so it
        // sits naturally on the paper background.
        steel: {
          50: '#f7f7f6',
          100: '#ececeb',
          200: '#dcdcda',
          300: '#c3c3c0',
          400: '#9c9c99',
          500: '#76766f',
          600: '#5a5a55',
          700: '#45453f',
          800: '#2f2f2b',
          900: '#1d1d1a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Display face for headlines — high-contrast serif with a calligraphic
        // italic. Used sparingly (hero + section titles), never for body copy.
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        // Layered "elevation" scale — soft, multi-stop shadows for the floating
        // 3D look. Higher = lifts further off the page.
        'elev-1': '0 1px 2px rgba(11,20,38,0.04), 0 2px 6px -1px rgba(11,20,38,0.06)',
        'elev-2': '0 2px 4px rgba(11,20,38,0.04), 0 10px 22px -6px rgba(11,20,38,0.10)',
        'elev-3': '0 8px 16px -4px rgba(11,20,38,0.08), 0 22px 46px -10px rgba(11,20,38,0.16)',
        'elev-4': '0 14px 28px -8px rgba(11,20,38,0.12), 0 40px 72px -16px rgba(11,20,38,0.22)',
        // Legacy aliases kept so existing classes still resolve.
        card: '0 1px 2px rgba(11,20,38,0.04), 0 2px 6px -1px rgba(11,20,38,0.06)',
        'card-hover': '0 14px 28px -8px rgba(11,20,38,0.12), 0 40px 72px -16px rgba(11,20,38,0.22)',
        // Raised buttons: inset top sheen + soft drop + colored glow.
        btn: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 1px 2px rgba(11,20,38,0.12), 0 8px 18px -6px rgba(10,116,240,0.5)',
        'btn-hover': 'inset 0 1px 0 rgba(255,255,255,0.45), 0 2px 4px rgba(11,20,38,0.14), 0 14px 28px -8px rgba(10,116,240,0.6)',
        'btn-dark': 'inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 2px rgba(11,20,38,0.2), 0 10px 22px -8px rgba(11,20,38,0.5)',
        tile: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 6px 14px -4px rgba(10,116,240,0.45)',
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.6)',
        glow: '0 0 0 1px rgba(51,146,255,0.18), 0 12px 40px -8px rgba(51,146,255,0.45)',
        'glow-violet': '0 0 0 1px rgba(51,146,255,0.2), 0 12px 40px -8px rgba(10,116,240,0.4)',

        // ---- Embossed metal system -------------------------------------------
        // Depth comes from LIGHT, not gradients: a crisp highlight on the top edge,
        // a dark cut on the bottom edge, and a soft cast shadow. Light is always
        // from above, so every raised element agrees on one light source.
        // Raised solid surface (buttons, tiles).
        emboss:
          'inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -2px 0 rgba(11,20,38,0.22), 0 1px 1px rgba(11,20,38,0.10), 0 8px 18px -6px rgba(11,20,38,0.28)',
        'emboss-hover':
          'inset 0 1px 0 rgba(255,255,255,0.38), inset 0 -2px 0 rgba(11,20,38,0.22), 0 2px 3px rgba(11,20,38,0.12), 0 14px 26px -8px rgba(11,20,38,0.34)',
        // Pressed: the cut flips to the top and the cast shadow collapses.
        'emboss-press':
          'inset 0 2px 3px rgba(11,20,38,0.30), inset 0 -1px 0 rgba(255,255,255,0.18), 0 1px 1px rgba(11,20,38,0.10)',
        // Raised paper/white card sitting on the sheet.
        'emboss-card':
          'inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 1px rgba(11,20,38,0.05), 0 10px 24px -10px rgba(11,20,38,0.22), 0 28px 56px -24px rgba(11,20,38,0.20)',
        'emboss-card-hover':
          'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 3px rgba(11,20,38,0.06), 0 18px 38px -12px rgba(11,20,38,0.28), 0 44px 80px -28px rgba(11,20,38,0.26)',
        // Debossed: stamped INTO the sheet (inputs, wells, inset panels).
        deboss:
          'inset 0 2px 4px rgba(11,20,38,0.10), inset 0 -1px 0 rgba(255,255,255,0.85)',
      },
      backgroundImage: {
        // NOTE: the landing page no longer uses these — it is built on the flat
        // paper + embossed-metal system above. They remain for the rest of the app
        // (billing, rewards, guide, auth…), now purple-free: blue → cyan only.
        'brand-gradient': 'linear-gradient(135deg, #0a74f0 0%, #1fbef0 100%)',
        'btn-blue': 'linear-gradient(180deg, #3a9bff 0%, #0a74f0 100%)',
        'btn-navy': 'linear-gradient(180deg, #1d2d52 0%, #0b1426 100%)',
        'btn-red': 'linear-gradient(180deg, #f4584f 0%, #dc2626 100%)',
        'tile-soft': 'linear-gradient(145deg, #e8f3ff 0%, #e6fbff 100%)',
        sheen: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 45%)',
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
