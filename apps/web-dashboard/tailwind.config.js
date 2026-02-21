/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kpost: {
          primary: '#1a56db',
          secondary: '#6b7280',
          success: '#059669',
          warning: '#d97706',
          danger: '#dc2626',
        },
      },
    },
  },
  plugins: [],
};
