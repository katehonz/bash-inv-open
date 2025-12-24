import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { Box, CircularProgress } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'dayjs/locale/bg';

import client from './apollo/client';
import AuthenticatedApp from './components/AuthenticatedApp';
import Login from './pages/Login';
import VerifyDocument from './pages/VerifyDocument';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Main App content component that checks authentication
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated() ? <AuthenticatedApp /> : <Login />;
};

function App() {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="bg">
          <BrowserRouter>
            <Routes>
              <Route path="/verify" element={<VerifyDocument />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/*" element={
                <AuthProvider>
                  <AppContent />
                </AuthProvider>
              } />
            </Routes>
          </BrowserRouter>
        </LocalizationProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}

export default App;
