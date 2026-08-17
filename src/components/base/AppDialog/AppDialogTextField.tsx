import TextField, { type TextFieldProps } from '@mui/material/TextField';

import { appDialogTextFieldProps } from './appDialogFormStyles';

export type AppDialogTextFieldProps = TextFieldProps;

export const AppDialogTextField = (props: AppDialogTextFieldProps) => (
  <TextField {...appDialogTextFieldProps} {...props} />
);
