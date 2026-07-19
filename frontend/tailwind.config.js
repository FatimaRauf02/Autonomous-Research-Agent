/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#f0f4ff', 500: '#3b5bdb', 600: '#2f4ac0', 900: '#1a2f7a' },
      },
    },
  },
  plugins: [],
}
