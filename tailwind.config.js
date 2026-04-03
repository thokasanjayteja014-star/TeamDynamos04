/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'base-bg': '#0D0D1A',
        'card-bg': '#13132A',
        'surface': '#1A1A35',
        'primary': '#7C3AED',
        'accent': '#A855F7',
        'success': '#10B981',
        'gold': '#F59E0B',
        'danger': '#EF4444',
        'pink-bright': '#EC4899',
        'text-body': '#A1A1B5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F59E0B 100%)',
        'card-glow-border': 'linear-gradient(135deg, #7C3AED, #A855F7, #EC4899)',
        'success-fill': 'linear-gradient(135deg, #10B981, #34D399)',
        'gold-bar': 'linear-gradient(90deg, #F59E0B, #FBBF24)',
        'cta-gradient': 'linear-gradient(135deg, #7C3AED, #A855F7)',
        'danger-fill': 'linear-gradient(135deg, #EF4444, #F87171)',
        'level-active': 'linear-gradient(135deg, #10B981, #059669)',
        'level-complete': 'linear-gradient(135deg, #7C3AED, #EC4899)',
      },
      keyframes: {
        pageFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pageFadeOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-10px)' },
        },
        blobFadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        blobDrift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(8px, -12px) scale(1.03)' },
        },
        cardDrop: {
          '0%': { opacity: '0', transform: 'translateY(32px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        logoPop: {
          '0%': { opacity: '0', transform: 'scale(0.5) rotate(-20deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.15' },
          '100%': { transform: 'scale(3)', opacity: '0' },
        },
        inputShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        spinCustom: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        dotBounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
        },
        tileIn: {
          '0%': { opacity: '0', transform: 'scale(0.7) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        selectedBounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
        tileRipple: {
          '0%': { transform: 'scale(0.5)', opacity: '0.5' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        bannerSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gradientShift: {
          '0%, 100%': { filter: 'hue-rotate(0deg)' },
          '50%': { filter: 'hue-rotate(15deg)' },
        },
      },
      animation: {
        pageFadeIn: 'pageFadeIn 300ms ease forwards',
        pageFadeOut: 'pageFadeOut 300ms ease forwards',
        blobFadeIn: 'blobFadeIn 1.2s ease forwards',
        blobDrift: 'blobDrift 20s infinite',
        cardDrop: 'cardDrop 500ms cubic-bezier(0.34,1.56,0.64,1) forwards',
        logoPop: 'logoPop 400ms cubic-bezier(0.34,1.56,0.64,1) 200ms both',
        fadeUp: 'fadeUp 400ms ease 300ms both',
        ripple: 'ripple 500ms ease-out',
        inputShake: 'inputShake 400ms ease',
        shimmer: 'shimmer 600ms ease',
        spinCustom: 'spinCustom 0.7s linear infinite',
        dotBounce: 'dotBounce 300ms ease',
        tileIn: 'tileIn 300ms ease both',
        selectedBounce: 'selectedBounce 300ms ease',
        tileRipple: 'tileRipple 500ms ease-out forwards',
        bannerSlideIn: 'bannerSlideIn 500ms ease 200ms both',
        gradientShift: 'gradientShift 4s infinite',
      },
    },
  },
  plugins: [],
};