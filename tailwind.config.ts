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
        surface: '#FFF8F0',
        border: '#F0E6D6',
        'text-primary': '#1A1A2E',
        'text-secondary': '#6b7280',
        'text-muted': '#9ca3af',
        accent: '#F5A623',
        'accent-hover': '#E09516',
        'accent-light': '#FFF5E6',
        popover: '#ffffff',
        'popover-foreground': '#1A1A2E',
        input: '#F0E6D6',
        ring: '#F5A623',
        card: '#ffffff',
        'card-foreground': '#1A1A2E',
        primary: {
          DEFAULT: '#F5A623',
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
          DEFAULT: '#FFF8F0',
          foreground: '#6b7280',
        },
        sidebar: {
          bg: '#FFF8F0',
          active: '#FFF0D4',
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
