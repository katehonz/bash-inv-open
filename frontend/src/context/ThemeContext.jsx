import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Modern Light Mode
          primary: {
            main: '#2563eb', // Rich Blue
            light: '#60a5fa',
            dark: '#1e40af',
          },
          secondary: {
            main: '#7c3aed', // Purple
          },
          background: {
            default: '#f8fafc', // Very light blue-grey
            paper: '#ffffff',
          },
          text: {
            primary: '#1e293b',
            secondary: '#64748b',
          },
        }
      : {
          // Modern Dark Mode
          primary: {
            main: '#60a5fa', // Lighter Blue for contrast
            light: '#93c5fd',
            dark: '#2563eb',
          },
          secondary: {
            main: '#a78bfa', // Lighter Purple
          },
          background: {
            default: '#0f172a', // Slate 900
            paper: '#1e293b',   // Slate 800
          },
          text: {
            primary: '#f1f5f9',
            secondary: '#94a3b8',
          },
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none', // Modern apps rarely use uppercase buttons
    },
  },
  shape: {
    borderRadius: 12, // More rounded, modern look
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Removes default elevation overlay in dark mode for cleaner look
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
        },
      },
    },
  },
});

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const value = useMemo(
    () => ({
      mode,
      toggleTheme,
      isDark: mode === 'dark',
    }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
