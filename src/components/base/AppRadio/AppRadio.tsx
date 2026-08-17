import FormControlLabel from '@mui/material/FormControlLabel';
import Radio, { type RadioProps } from '@mui/material/Radio';

export type AppRadioProps = RadioProps & { label?: string };

export const AppRadio = ({ label, ...props }: AppRadioProps) =>
  label ? <FormControlLabel control={<Radio {...props} />} label={label} /> : <Radio {...props} />;
