import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectProps } from '@mui/material/Select';

export type AppSelectOption<T extends string | number = string> = { label: string; value: T };
export type AppSelectProps<T extends string | number = string> = SelectProps<T> & {
  label?: string;
  options: AppSelectOption<T>[];
};

export const AppSelect = <T extends string | number = string>({
  label,
  options,
  ...props
}: AppSelectProps<T>) => (
  <FormControl fullWidth size={props.size ?? 'small'}>
    {label ? <InputLabel>{label}</InputLabel> : null}
    <Select label={label} {...props}>
      {options.map((option) => (
        <MenuItem key={String(option.value)} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);
