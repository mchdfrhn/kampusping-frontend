import Alert, { type AlertProps } from '@mui/material/Alert';

export type AppAlertProps = AlertProps;

export const AppAlert = (props: AppAlertProps) => <Alert variant="filled" {...props} />;
