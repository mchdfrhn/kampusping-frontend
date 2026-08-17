import Checkbox, { type CheckboxProps } from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

export type AppCheckboxProps = CheckboxProps & { label?: string };

export const AppCheckbox = ({ label, ...props }: AppCheckboxProps) =>
  label ? <FormControlLabel control={<Checkbox {...props} />} label={label} /> : <Checkbox {...props} />;
