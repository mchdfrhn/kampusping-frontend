import Alert from '@mui/material/Alert';

export const ErrorState = ({ message = 'Something went wrong.' }: { message?: string }) => <Alert severity="error">{message}</Alert>;
