'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useState } from 'react';

import { AppEmptyState } from '@/components/base/AppEmptyState';
import { PageTitle } from '@/core/layout/PageData';
import { notificationService, type NotificationItem } from '@/core/services/notification.service';
import { formatDisplayDateTime } from '@/core/utils/date.util';

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await notificationService.list({ page: 1, page_size: 50 });
      setItems(data.items);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageTitle>Notifications</PageTitle>
      <Card sx={{ flex: 1 }}>
        <CardHeader title="Notifications" subheader="Template halaman notifikasi. Hubungkan ke API project." />
        <CardContent>
          {items.length === 0 ? (
            <AppEmptyState title="No notifications" description="Belum ada notifikasi, atau API belum terhubung." />
          ) : (
            items.map((item) => (
              <Box key={item.id} sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}>
                <Typography sx={{ fontWeight: 700 }}>{item.title}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {item.message}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  {item.created_at ? formatDisplayDateTime(item.created_at) : ''}
                </Typography>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
