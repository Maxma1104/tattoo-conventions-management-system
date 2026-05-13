/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        white: {
          DEFAULT: '#ffffff',
          18: 'rgba(255, 255, 255, 0.18)',
        },
        hermes: {
          lightBg: '#f4f7fb',
          darkBg: '#081412',
          blue: '#1f4edb',
          blueHover: '#173bb5',
          teal: '#1b7c7a',
          ivory: '#e8e3d6',
          ivoryDim: '#c4bfaa',
          gridLight: 'rgba(31, 78, 219, 0.1)',
          gridDark: 'rgba(27, 124, 122, 0.2)',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grain': "url('https://grainy-gradients.vercel.app/noise.svg')",
      }
    },
  },
  plugins: [],
};
