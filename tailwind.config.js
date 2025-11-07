/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Minecraft"', '"Press Start 2P"', 'monospace'],
      },
      colors: {
        retro: {
          bg: '#0f1024',
          panel: '#1b1d3b',
          accent: '#ffd447',
          accentDark: '#da9d2f',
          text: '#f4f4f8',
          soft: '#9fa4ff',
        },
      },
    },
  },
  plugins: [],
}

