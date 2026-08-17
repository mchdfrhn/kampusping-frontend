import type { Components, Theme } from '@mui/material/styles';

export const components: Components<Omit<Theme, 'components'>> = {
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: { root: { borderRadius: 8, fontWeight: 700 } },
  },
  MuiTextField: { defaultProps: { size: 'small', variant: 'outlined' } },
  MuiSelect: { defaultProps: { size: 'small' } },
  MuiCard: { styleOverrides: { root: { borderRadius: 14, border: '1px solid #E7EAF0' } } },
  MuiPaper: { styleOverrides: { rounded: { borderRadius: 14 } } },
  MuiTableCell: { styleOverrides: { head: { fontWeight: 700, backgroundColor: '#F8FAFC' } } },
  MuiAppBar: { defaultProps: { elevation: 0 } },
  MuiDrawer: { styleOverrides: { paper: { borderRight: 0 } } },
  MuiDialog: { defaultProps: { fullWidth: true, maxWidth: 'sm' } },
  MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
  MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 } } },
  MuiTooltip: { defaultProps: { arrow: true } },
};
