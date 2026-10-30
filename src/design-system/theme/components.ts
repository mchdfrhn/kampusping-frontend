import type { Components, Theme } from '@mui/material/styles';

const RADIUS = 12;

export const components: Components<Omit<Theme, 'components'>> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: { root: { borderRadius: 8 } },
  },
  MuiIconButton: { styleOverrides: { root: { borderRadius: 8 } } },
  MuiTextField: { defaultProps: { size: 'small', variant: 'outlined' } },
  MuiSelect: { defaultProps: { size: 'small' } },
  MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 8 } } },
  MuiCard: {
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: RADIUS,
        border: `1px solid ${(theme.vars ?? theme).palette.divider}`,
        backgroundImage: 'none',
      }),
    },
  },
  MuiCardHeader: {
    styleOverrides: {
      title: { fontSize: '1rem', fontWeight: 600 },
      subheader: { fontSize: '0.8125rem' },
    },
  },
  MuiPaper: {
    defaultProps: { elevation: 0 },
    styleOverrides: { rounded: { borderRadius: RADIUS }, root: { backgroundImage: 'none' } },
  },
  MuiTableCell: {
    styleOverrides: {
      head: ({ theme }) => ({
        fontWeight: 600,
        backgroundColor: (theme.vars ?? theme).palette.background.default,
      }),
    },
  },
  MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' } },
  MuiDrawer: { styleOverrides: { paper: { backgroundImage: 'none' } } },
  MuiDialog: {
    defaultProps: { fullWidth: true, maxWidth: 'sm' },
    styleOverrides: { paper: { borderRadius: RADIUS + 4 } },
  },
  MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
  MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 } } },
  MuiTooltip: { defaultProps: { arrow: true } },
  MuiListItemButton: { styleOverrides: { root: { borderRadius: 8 } } },
  MuiMenu: { styleOverrides: { paper: { borderRadius: 10 } } },
};
