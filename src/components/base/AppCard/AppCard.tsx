import Card, { type CardProps } from '@mui/material/Card';

export type AppCardProps = CardProps;

export const AppCard = (props: AppCardProps) => <Card {...props} />;
