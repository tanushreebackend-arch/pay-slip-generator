import { createTheme } from '@mui/material/styles'

export const paygenTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7C3AED',
      light: '#A78BFA',
      dark: '#6D28D9',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#111827',
    },
    background: {
      default: '#F7F5FB',
      paper: '#ffffff',
    },
    success: { main: '#16a34a' },
    warning: { main: '#f59e0b' },
    error: { main: '#dc2626' },
    info: { main: '#2563eb' },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
  },
})
