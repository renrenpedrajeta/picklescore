/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'deep-green': '#203F39',
        teal: '#0F5C62',
        'dark-teal': '#084B46',
        'forest-teal': '#085953',
        sage: '#8A9B82',
        'pale-sage': '#EAF0E5',
        'off-white': '#FAF9F5',
        ivory: '#FEFEFB',
        muted: '#748079',
        line: '#E2E5DC',
        cream: '#FEECD6',
        error: '#BA1A1A',
        // Semantic aliases
        canvas: '#FAF9F5',
        surface: '#EAF0E5',
        'surface-hover': '#EAF0E5',
        primary: '#0F5C62',
        'primary-hover': '#085953',
        ball: '#FEECD6',
        forest: '#203F39',
        'line-soft': '#E2E5DC',
        jade: '#8A9B82',
      },
      fontFamily: {
        outfit: ['var(--font-outfit)', 'Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
