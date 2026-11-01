import { AuthGuard } from '@/components/layout/AuthGuard';
import { HomeRedirect } from '@/components/layout/HomeRedirect';

// AuthGuard sends anonymous visitors to the login page; signed-in users go on to the first page
// their permissions allow (the dashboard needs `dashboard:read`, so it cannot be hardcoded).
export default function HomePage() {
  return (
    <AuthGuard>
      <HomeRedirect />
    </AuthGuard>
  );
}
