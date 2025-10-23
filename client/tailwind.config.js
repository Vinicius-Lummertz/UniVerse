// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Caminhos padrão para projetos React/Vite
  ],
  theme: {
    extend: {
      backgroundImage:{
        'stars': "url('/beanstalk-dark.webp')",
      },
      colors: {
        'space-dark': '#0f172a', // Um azul quase preto
      },
      animation: {
        'aurora': 'aurora 5s linear infinite',
      },
      keyframes: {
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        }
      }
    },
  },
  plugins: [],
}