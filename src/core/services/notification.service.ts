import { apiClient } from '@/core/http/api-client';

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  target_path: string;
  is_read: boolean;
  created_at?: string;
};

export type NotificationListResponse = {
  items: NotificationItem[];
  total: number;
  page: number;
  page_size: number;
  unread_count: number;
};

export const notificationService = {
  list: async (params: { page?: number; page_size?: number; unread_only?: boolean } = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) qs.set(key, String(value));
    });
    const res = await apiClient.get<NotificationListResponse>(`/notifications?${qs.toString()}`);
    return res.data;
  },

  unreadCount: async () => {
    const res = await apiClient.get<{ unread_count: number }>('/notifications/unread-count');
    return res.data.unread_count;
  },

  markRead: async (id: number) => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllRead: async () => {
    await apiClient.patch('/notifications/read-all');
  },
};
