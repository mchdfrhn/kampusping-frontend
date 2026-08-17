import FormControlLabel from '@mui/material/FormControlLabel';
import Switch, { type SwitchProps } from '@mui/material/Switch';

export type AppSwitchProps = SwitchProps & { label?: string };

export const AppSwitch = ({ label, ...props }: AppSwitchProps) =>
  label ? <FormControlLabel control={<Switch {...props} />} label={label} /> : <Switch {...props} />;
