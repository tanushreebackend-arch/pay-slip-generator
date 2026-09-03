import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        surface: '#F7F5FB',
        border: '#E8E4F0',
        'text-primary': '#1A1A2E',
        'text-secondary': '#6b7280',
        'text-muted': '#9ca3af',
        accent: '#7C3AED',
        'accent-hover': '#6D28D9',
        'accent-light': '#F3EEFF',
        popover: '#ffffff',
        'popover-foreground': '#1A1A2E',
        input: '#E8E4F0',
        ring: '#7C3AED',
        card: '#ffffff',
        'card-foreground': '#1A1A2E',
        primary: {
          DEFAULT: '#7C3AED',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#ffffff',
          foreground: '#1A1A2E',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#ffffff',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEF2F2',
        },
        muted: {
          DEFAULT: '#F7F5FB',
          foreground: '#6b7280',
        },
        sidebar: {
          bg: '#FFFFFF',
          active: '#EDE9FE',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)',
      },
      fontSize: {
        base: ['14px', { lineHeight: '1.6' }],
      },
    },
  },
  plugins: [],
}
export default config
