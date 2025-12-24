import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useLazyQuery } from '@apollo/client';
import { RESET_PASSWORD, VALIDATE_RESET_TOKEN } from '../graphql/mutations';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenValid, setTokenValid] = useState(null);
  const [tokenChecked, setTokenChecked] = useState(false);

  const [validateToken, { loading: validating }] = useLazyQuery(VALIDATE_RESET_TOKEN, {
    onCompleted: (data) => {
      setTokenChecked(true);
      if (data.validatePasswordResetToken?.valid) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setError(data.validatePasswordResetToken?.message || 'Невалиден или изтекъл токен');
      }
    },
    onError: (err) => {
      setTokenChecked(true);
      setTokenValid(false);
      setError('Грешка при валидиране на токена');
      console.error('Token validation error:', err);
    }
  });

  const [resetPassword, { loading: resetting }] = useMutation(RESET_PASSWORD, {
    onCompleted: (data) => {
      if (data.resetPassword?.success) {
        setSuccess('Паролата е променена успешно! Ще бъдете пренасочени към страницата за вход...');
        setError('');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(data.resetPassword?.message || 'Грешка при промяна на паролата');
      }
    },
    onError: (err) => {
      setError('Грешка при промяна на паролата: ' + err.message);
      console.error('Password reset error:', err);
    }
  });

  useEffect(() => {
    if (token && !tokenChecked) {
      validateToken({ variables: { token } });
    } else if (!token) {
      setTokenChecked(true);
      setTokenValid(false);
      setError('Липсва токен за възстановяване на парола');
    }
  }, [token, tokenChecked, validateToken]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Моля, въведете и потвърдете новата парола');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Паролите не съвпадат');
      return;
    }

    if (newPassword.length < 8) {
      setError('Паролата трябва да е поне 8 символа');
      return;
    }

    // Check for at least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setError('Паролата трябва да съдържа поне една буква и една цифра');
      return;
    }

    resetPassword({
      variables: {
        input: {
          token: token,
          newPassword: newPassword
        }
      }
    });
  };

  // Loading state while checking token
  if (!tokenChecked || validating) {
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
          <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Проверка на токена...</Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
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
            <Typography component="h1" variant="h5" align="center" gutterBottom color="error">
              Невалиден токен
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || 'Токенът за възстановяване на парола е невалиден или е изтекъл.'}
            </Alert>
            <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
              Моля, заявете нов линк за възстановяване на парола.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/')}
            >
              Към страницата за вход
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  // Valid token - show password reset form
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
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Нова парола
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
            Въведете новата си парола. Паролата трябва да е поне 8 символа и да съдържа букви и цифри.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="Нова парола"
              type="password"
              id="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={resetting || success}
              autoFocus
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Потвърдете паролата"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={resetting || success}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={resetting || success}
            >
              {resetting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Промени паролата'
              )}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate('/')}
                sx={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                Обратно към вход
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword;
