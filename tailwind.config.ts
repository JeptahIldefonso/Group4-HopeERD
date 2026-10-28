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
        emerald: {
          50: '#EAF5EE',
          100: '#D5ECD9',
          200: '#ABDBB7',
          300: '#75C38B',
          400: '#42A663',
          500: '#228B47',
          600: '#1B5E43', // Primary brand green
          700: '#154C36',
          800: '#103B2A',
          900: '#0B291D',
        },
        forest: {
          50: '#EAF5EE',
          100: '#D5ECD9',
          200: '#ABDBB7',
          500: '#228B47',
          600: '#1B5E43',
          700: '#154C36',
          800: '#103B2A',
        },
        charcoal: {
          900: '#111827',
          800: '#1F2937',
          700: '#374151',
          600: '#4B5563',
          500: '#6B7280',
          400: '#9CA3AF',
        },
        border: {
          DEFAULT: '#E5E7EB',
          subtle: '#F1F5F9',
          strong: '#D1D5DB',
        },
        paper: {
          DEFAULT: '#F8FAFC',
          raised: '#FFFFFF',
          hover: '#F9FAFB',
          subtle: '#F1F5F9',
        },
        ink: {
          DEFAULT: '#111827',
          muted: '#4B5563',
          subtle: '#6B7280',
          faint: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        xs: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        sm: '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
