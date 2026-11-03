import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

type Props = {
  label: string;
  value: string;
  /** A second line: the rupiah amount, or a note such as the target. */
  caption?: ReactNode;
  /** `error` marks a figure that needs attention (e.g. overdue invoices). */
  tone?: 'default' | 'error';
};

export const StatCard = ({ label, value, caption, tone = 'default' }: Props) => (
  <Card
    data-stat=""
    data-tone={tone}
    variant="outlined"
    sx={{
      bgcolor: 'background.paper',
      borderColor: tone === 'error' ? 'error.main' : 'divider',
      borderRadius: 1.5,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      height: '100%',
    }}
  >
    <CardContent
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        p: '12px 14px !important',
      }}
    >
      <Typography
        color="text.secondary"
        sx={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.25, minHeight: 18 }}
        variant="body2"
      >
        {label}
      </Typography>
      <Typography
        component="p"
        noWrap
        sx={{
          color: tone === 'error' ? 'error.main' : 'text.primary',
          fontSize: '1.45rem',
          fontWeight: 700,
          lineHeight: 1.2,
          mt: 0.25,
        }}
        variant="h4"
      >
        {value}
      </Typography>
      {caption ? (
        <Typography
          color="text.secondary"
          noWrap
          sx={{ fontSize: '0.75rem', fontWeight: 500, mt: 0.25 }}
          variant="body2"
        >
          {caption}
        </Typography>
      ) : null}
    </CardContent>
  </Card>
);
