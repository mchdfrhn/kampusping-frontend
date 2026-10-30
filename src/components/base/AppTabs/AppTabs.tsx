import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs, { type TabsProps } from '@mui/material/Tabs';

export type AppTabItem = { label: string; value: string };
export type AppTabsProps = TabsProps & { items: AppTabItem[] };

export const AppTabs = ({ items, ...props }: AppTabsProps) => (
  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
    <Tabs {...props}>
      {items.map((item) => (
        <Tab key={item.value} label={item.label} value={item.value} />
      ))}
    </Tabs>
  </Box>
);
