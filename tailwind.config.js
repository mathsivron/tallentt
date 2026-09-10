/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0A13E6',
          dark: '#080fb8',
          light: '#3d45f0',
        },
        surface: {
          DEFAULT: '#F7F3EB',
          warm: '#F5F3EF',
          card: '#FAFAF8',
        },
      },
      maxWidth: {
        card: '300px',
      },
      minWidth: {
        card: '260px',
      },
      borderWidth: {
        1.5: '1.5px',
      },
    },
  },
  plugins: [],
}
