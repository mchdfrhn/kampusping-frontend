import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import MarkChatReadOutlinedIcon from '@mui/icons-material/MarkChatReadOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

import { permissions } from '@/core/auth/permissions';
import { routes } from '@/core/config/route.config';
import type { MenuGroupConfig } from '@/core/types/menu.type';

/**
 * Sidebar navigation. Items with a `permission` are shown only to users who hold it
 * (`filterMenuByPermission`); the page and the API enforce the same permission independently.
 *
 * To add a module, add an entry here and a route under `src/app/(app)/`.
 */
export const menuConfig: MenuGroupConfig[] = [
  {
    title: 'Penagihan',
    items: [
      {
        label: 'Dasbor',
        path: routes.dashboard,
        icon: DashboardOutlinedIcon,
        permission: permissions.dashboardRead,
      },
      {
        label: 'Laporan',
        path: routes.reports,
        icon: AssessmentOutlinedIcon,
        permission: permissions.reportsRead,
      },
      {
        label: 'Impor Data',
        path: routes.import,
        icon: UploadFileOutlinedIcon,
        permission: permissions.importsRead,
      },
      {
        label: 'Mahasiswa',
        path: routes.students,
        icon: SchoolOutlinedIcon,
        permission: permissions.studentsRead,
      },
      {
        label: 'Tagihan',
        path: routes.invoices,
        icon: ReceiptLongOutlinedIcon,
        permission: permissions.invoicesRead,
      },
      {
        label: 'Pengiriman',
        path: routes.messages,
        icon: MarkChatReadOutlinedIcon,
        permission: permissions.messagesRead,
      },
      {
        label: 'Kirim Manual',
        path: routes.manualSend,
        icon: SendOutlinedIcon,
        permission: permissions.messagesSend,
      },
    ],
  },
  {
    title: 'Pengaturan Pesan',
    items: [
      {
        label: 'Template Pesan',
        path: routes.templates,
        icon: SmsOutlinedIcon,
        permission: permissions.templatesRead,
      },
      {
        label: 'Jadwal',
        path: routes.schedules,
        icon: EventRepeatOutlinedIcon,
        permission: permissions.schedulesRead,
      },
    ],
  },
  {
    title: 'Administrasi',
    items: [
      {
        label: 'Pengaturan',
        path: routes.settings,
        icon: SettingsOutlinedIcon,
        permission: permissions.settingsRead,
      },
      {
        label: 'Pengguna',
        path: routes.users,
        icon: GroupOutlinedIcon,
        permission: permissions.usersRead,
      },
      {
        label: 'Peran',
        path: routes.roles,
        icon: AdminPanelSettingsOutlinedIcon,
        permission: permissions.rolesRead,
      },
      {
        label: 'Audit',
        path: routes.audit,
        icon: FactCheckOutlinedIcon,
        permission: permissions.auditRead,
      },
    ],
  },
];
