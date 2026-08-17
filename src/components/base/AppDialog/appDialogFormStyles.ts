import type { SxProps, Theme } from '@mui/material/styles';
import type { TextFieldProps } from '@mui/material/TextField';

const DIALOG_INPUT_HEIGHT = 44;

export const appDialogContentFormSx: SxProps<Theme> = {
  py: 2.5,
  '& .MuiTextField-root': {
    width: '100%',
  },
  '& .MuiOutlinedInput-root': {
    height: DIALOG_INPUT_HEIGHT,
    borderRadius: 1.5,
    alignItems: 'center',
  },
  '& .MuiInputBase-input': {
    fontSize: 14,
    py: 0,
    px: 1.75,
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
  },
  '& .MuiInputBase-input::placeholder': {
    opacity: 1,
    color: 'text.secondary',
  },
  '& .MuiInputLabel-root': {
    fontSize: 14,
  },
  '& .MuiInputLabel-outlined': {
    '&:not(.MuiInputLabel-shrink)': {
      transform: 'translate(14px, 12px) scale(1)',
    },
    '&.MuiInputLabel-shrink': {
      transform: 'translate(14px, -9px) scale(0.75)',
    },
  },
  '& .MuiFormHelperText-root': {
    fontSize: 12,
    mt: 0.75,
  },
  '& .MuiFormControlLabel-root .MuiFormControlLabel-label': {
    fontSize: 14,
  },
};

export const appDialogTextFieldProps: Pick<TextFieldProps, 'fullWidth' | 'size' | 'variant'> = {
  fullWidth: true,
  size: 'small',
  variant: 'outlined',
};
