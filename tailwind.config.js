/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e3eaf3',
          100: '#b9cce0',
          200: '#8baacb',
          300: '#5d88b6',
          400: '#3a6fa7',
          DEFAULT: '#1E3A5F',
          600: '#193454',
          700: '#142d48',
          800: '#0f253d',
          900: '#081829',
        },
        accent: {
          50:  '#fef9ec',
          100: '#fef0c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          DEFAULT: '#F59E0B',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
