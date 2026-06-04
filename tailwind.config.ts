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
        surface: '#f9fafb',
        border: '#e5e7eb',
        'text-primary': '#111827',
        'text-secondary': '#6b7280',
        'text-muted': '#9ca3af',
        accent: '#EB3514',
        'accent-hover': '#d42e10',
        'accent-light': '#fff5f3',
        popover: '#ffffff',
        'popover-foreground': '#111827',
        input: '#e5e7eb',
        ring: '#EB3514',
        card: '#ffffff',
        'card-foreground': '#111827',
        primary: {
          DEFAULT: '#EB3514',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#ffffff',
          foreground: '#111827',
        },
        destructive: {
          DEFAULT: '#EB3514',
          foreground: '#ffffff',
        },
        danger: {
          DEFAULT: '#EB3514',
          light: '#fff5f3',
        },
        muted: {
          DEFAULT: '#f9fafb',
          foreground: '#6b7280',
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
