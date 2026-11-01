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
    sx={{
      borderColor: tone === 'error' ? 'error.main' : undefined,
      borderWidth: tone === 'error' ? 1 : undefined,
    }}
  >
    <CardContent>
      <Typography color="text.secondary" sx={{ fontWeight: 600 }} variant="body2">
        {label}
      </Typography>
      <Typography
        component="p"
        sx={{ color: tone === 'error' ? 'error.main' : 'text.primary', mt: 0.5 }}
        variant="h4"
      >
        {value}
      </Typography>
      {caption ? (
        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
          {caption}
        </Typography>
      ) : null}
    </CardContent>
  </Card>
);
