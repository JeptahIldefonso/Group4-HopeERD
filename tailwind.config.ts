import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F4F4F0',
          raised: '#FFFFFF',
          hover: '#EAEAE4',
          subtle: '#DFDFD7',
        },
        ink: {
          DEFAULT: '#041a24',
          muted: '#1c313b',
          subtle: '#41555f',
          faint: '#728590',
        },
        midnight: {
          900: '#041a24',
          800: '#072432',
          700: '#0d3244',
          600: '#144158',
        },
        parchment: '#F4F4F0',
        hairline: 'rgba(4, 26, 36, 0.14)',
        'hairline-strong': '#041a24',
      },
      fontFamily: {
        editorial: ['var(--font-editorial)', 'Newsreader', 'Georgia', 'Cambria', 'serif'],
        sans: ['var(--font-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '6px',
        xl: '8px',
      },
      boxShadow: {
        paper: '0 1px 3px rgba(4, 26, 36, 0.05), 0 1px 2px rgba(4, 26, 36, 0.03)',
        'paper-raised': '0 4px 6px -1px rgba(4, 26, 36, 0.07), 0 2px 4px -1px rgba(4, 26, 36, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
