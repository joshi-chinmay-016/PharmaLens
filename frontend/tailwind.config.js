/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#171717',
        paper: '#F8F7F2',
        'paper-surface': '#FFFFFF',
        muted: '#686868',
        subtle: '#D8D7D0',
        teal: {
          primary: '#0B7A75',
          deep: '#075E59',
          light: '#E6F4F3',
          50: '#F0FDF4',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0B7A75',
          700: '#075E59',
          800: '#054743',
          900: '#033330',
        },
        lime: {
          accent: '#D7F36B',
          hover: '#C6E752',
          light: '#F6FCE0',
        },
        pharmablue: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#102A43',
          950: '#0B1D30',
        },
        pharmateal: {
          50: '#F0FDF4',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0B7A75',
          700: '#075E59',
        },
        pharmaamber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'brutal-xs': '1px 1px 0px #171717',
        'brutal-sm': '2px 2px 0px #171717',
        'brutal': '4px 4px 0px #171717',
        'brutal-lg': '6px 6px 0px #171717',
        'brutal-xl': '8px 8px 0px #171717',
        'brutal-teal': '4px 4px 0px #075E59',
        'brutal-lime': '4px 4px 0px #171717',
        'brutal-inset': 'inset 2px 2px 0px #171717',
      }
    },
  },
  plugins: [],
}
