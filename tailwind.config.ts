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
        // Standardized Enterprise Palette
        navy: {
          900: '#172B3A', // Primary text
          800: '#1F384C',
          700: '#2A4A62',
        },
        deepgreen: {
          50: '#E8F3EE',  // Soft tint
          100: '#D1E7DC',
          500: '#1E8767',
          DEFAULT: '#176B52', // Primary buttons & brand accent
          hover: '#125540',   // Button hover
          active: '#0E4030',
        },
        slate: {
          500: '#64748B', // Secondary text
          400: '#94A3B8', // Muted text
          300: '#CBD5E1', // Hairline / subtle
        },
        softgray: {
          DEFAULT: '#DCE3E8', // Borders
          subtle: '#EEF2F5',
        },
        status: {
          success: '#15803D',
          warning: '#B45309',
          error: '#B91C1C',
        },
        // Backward-compatible semantic aliases
        forest: {
          50: '#E8F3EE',
          100: '#D1E7DC',
          200: '#A8C6B2',
          500: '#1E8767',
          600: '#176B52',
          700: '#125540',
          800: '#0E4030',
        },
        charcoal: {
          900: '#172B3A',
          700: '#64748B',
          500: '#64748B',
          400: '#94A3B8',
        },
        border: {
          standard: '#DCE3E8',
          strong: '#CBD5E1',
          divider: '#EEF2F5',
        },
        paper: {
          DEFAULT: '#F5F7F8',
          raised: '#FFFFFF',
          hover: '#FAFBFC',
          subtle: '#EEF2F5',
        },
        ink: {
          DEFAULT: '#172B3A',
          muted: '#64748B',
          subtle: '#94A3B8',
          faint: '#CBD5E1',
        },
        hairline: '#DCE3E8',
        'hairline-strong': '#CBD5E1',
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
        paper: '0 1px 3px rgba(23, 43, 58, 0.05), 0 1px 2px rgba(23, 43, 58, 0.03)',
        'paper-raised': '0 4px 6px -1px rgba(23, 43, 58, 0.07), 0 2px 4px -1px rgba(23, 43, 58, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
