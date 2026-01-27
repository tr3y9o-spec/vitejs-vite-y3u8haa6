/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // src以下の全てのjs, jsxファイルを対象にする記述
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}