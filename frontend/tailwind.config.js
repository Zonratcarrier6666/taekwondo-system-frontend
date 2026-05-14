// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        'titulo':    ['var(--text-titulo)', { lineHeight: '1.2' }],
        'subtitulo': ['var(--text-subtitulo)', { lineHeight: '1.3' }],
        'seccion':   ['var(--text-seccion)', { lineHeight: '1.4' }],
        'datos':     ['var(--text-datos)', { lineHeight: '1.6' }],
        'label':     ['var(--text-label)', { lineHeight: '1.4' }],
        'caption':   ['var(--text-caption)', { lineHeight: '1.4' }],
      },
    },
  },
  plugins: [],
}