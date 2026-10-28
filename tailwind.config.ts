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
        forest: {
          50: '#EAF2ED',
          100: '#D2E4D8',
          200: '#A8C6B2',
          500: '#477763',
          600: '#245B48',
          700: '#1C4939',
          800: '#15392C',
        },
        charcoal: {
          900: '#17231F',
          700: '#52615B',
          500: '#7A8781',
          400: '#A0AAA4',
        },
        border: {
          standard: '#DDE3DE',
          strong: '#CBD5CE',
          divider: '#E9EDEA',
        },
        // Backward-compatible semantic aliases
        paper: {
          DEFAULT: '#F5F6F4',
          raised: '#FFFFFF',
          hover: '#FAFBFA',
          subtle: '#F0F3F0',
        },
        ink: {
          DEFAULT: '#17231F',
          muted: '#52615B',
          subtle: '#7A8781',
          faint: '#A0AAA4',
        },
        hairline: '#DDE3DE',
        'hairline-strong': '#CBD5CE',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
        editorial: ['var(--font-editorial)', 'Newsreader', 'Georgia', 'serif'],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '6px',
        xl: '8px',
      },
      boxShadow: {
        paper: '0 1px 3px rgba(23, 35, 31, 0.05), 0 1px 2px rgba(23, 35, 31, 0.03)',
        'paper-raised': '0 4px 6px -1px rgba(23, 35, 31, 0.07), 0 2px 4px -1px rgba(23, 35, 31, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
