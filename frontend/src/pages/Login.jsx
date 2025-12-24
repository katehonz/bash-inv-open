import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import { VerifiedUser as VerifiedUserIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@apollo/client';
import { REQUEST_PASSWORD_RESET } from '../graphql/mutations';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  // Password Reset State
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const [requestPasswordReset, { loading: requestLoading }] = useMutation(REQUEST_PASSWORD_RESET, {
    onCompleted: (data) => {
      console.log('Password reset requested:', data);
      if (data.requestPasswordReset?.success) {
        setResetSuccess('Имейл с линк за възстановяване на паролата е изпратен. Моля, проверете вашата поща и кликнете на линка в имейла.');
        setResetError('');
      } else {
        setResetError(data.requestPasswordReset?.message || 'Грешка при заявката');
      }
    },
    onError: (error) => {
      console.error('Password reset request error:', error);
      setResetError('Грешка при заявката за възстановяване на паролата');
    }
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!formData.username || !formData.password) {
      setError('Моля въведете потребителско име и парола');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error('Грешно потребителско име или парола');
      }

      const data = await response.json();
      login(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Password Reset Functions
  const resetPasswordResetState = () => {
    setResetEmail('');
    setResetError('');
    setResetSuccess('');
  };

  const handlePasswordResetOpen = () => {
    setPasswordResetOpen(true);
    resetPasswordResetState();
  };

  const handlePasswordResetClose = () => {
    setPasswordResetOpen(false);
    resetPasswordResetState();
  };

  const handleRequestPasswordReset = async () => {
    if (!resetEmail) {
      setResetError('Моля въведете имейл адрес');
      return;
    }

    console.log('Requesting password reset for:', resetEmail);
    try {
      await requestPasswordReset({
        variables: { input: { email: resetEmail } }
      });
    } catch (error) {
      // Error handled in onError callback
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: 400 }}>
          <Typography component="h1" variant="h3" align="center" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Bash Inv
          </Typography>
          <Typography component="h2" variant="h6" align="center" gutterBottom sx={{ color: 'text.secondary', mb: 3 }}>
            Вход в системата
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Потребителско име или имейл"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleInputChange}
              disabled={loading}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Парола"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Вход'
              )}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={handlePasswordResetOpen}
                sx={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                Забравена парола?
              </Link>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Button
              fullWidth
              variant="outlined"
              startIcon={<VerifiedUserIcon />}
              href="/verify"
              sx={{ textTransform: 'none' }}
            >
              Валидатор на документи
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Password Reset Dialog */}
      <Dialog open={passwordResetOpen} onClose={handlePasswordResetClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Възстановяване на парола
        </DialogTitle>
        <DialogContent>
          {resetError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {resetError}
            </Alert>
          )}

          {resetSuccess && (
            <Alert severity="success" sx={{ mb: 2, mt: 1 }}>
              {resetSuccess}
            </Alert>
          )}

          {!resetSuccess && (
            <Box>
              <Typography variant="body2" sx={{ mb: 2, mt: 1 }}>
                Въведете вашия имейл адрес и ще ви изпратим линк за възстановяване на паролата.
              </Typography>
              <TextField
                fullWidth
                label="Имейл адрес"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                margin="normal"
                autoFocus
              />
            </Box>
          )}

        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordResetClose}>
            {resetSuccess ? 'Затвори' : 'Отказ'}
          </Button>
          {!resetSuccess && (
            <Button
              onClick={handleRequestPasswordReset}
              variant="contained"
              disabled={requestLoading}
            >
              {requestLoading ? <CircularProgress size={20} /> : 'Изпрати'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login;
