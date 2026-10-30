import Alert from '@mui/material/Alert';
import Snackbar, { type SnackbarProps } from '@mui/material/Snackbar';

export type AppSnackbarProps = SnackbarProps & {
  severity?: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

export const AppSnackbar = ({ severity = 'info', message, ...props }: AppSnackbarProps) => (
  <Snackbar autoHideDuration={4000} {...props}>
    <Alert severity={severity} variant="filled" sx={{ width: '100%' }}>
      {message}
    </Alert>
  </Snackbar>
);
