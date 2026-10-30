import Chip, { type ChipProps } from '@mui/material/Chip';

export type AppStatusChipProps = ChipProps & {
  status?: 'success' | 'warning' | 'error' | 'info' | 'default';
};

export const AppStatusChip = ({ status = 'default', ...props }: AppStatusChipProps) => (
  <Chip
    color={status === 'default' ? 'default' : status}
    size="small"
    variant="outlined"
    {...props}
  />
);
