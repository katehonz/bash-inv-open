import React, { useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { CheckCircle as CheckIcon } from '@mui/icons-material';

interface SuccessNotificationProps {
  open: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  open,
  message,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity="success"
        variant="filled"
        icon={<CheckIcon />}
        sx={{
          width: '100%',
          fontSize: '1rem',
          fontWeight: 'medium',
          '& .MuiAlert-icon': {
            fontSize: '1.5rem',
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SuccessNotification;