import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FAFAF8',
          surface: '#FFFFFF',
          muted: '#F3F2EE',
          border: '#E5E3DC',
          charcoal: '#1C1C1C',
          ink: '#2D2D2D',
          subtle: '#6B6A65',
        },
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
        display: ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

