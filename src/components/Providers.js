'use client';

import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from '@/context/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      light: '#2dd4bf',
      main: '#0d9488',
      dark: '#0f766e',
      contrastText: '#fff',
    },
    secondary: {
      light: '#67e8f9',
      main: '#0891b2',
      dark: '#0e7490',
      contrastText: '#fff',
    },
    success: {
      main: '#16a34a',
    },
    error: {
      main: '#dc2626',
    },
    info: {
      main: '#0891b2',
    },
    warning: {
      main: '#d97706',
    },
    background: {
      default: '#f1f5f9',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
});

export default function Providers({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
