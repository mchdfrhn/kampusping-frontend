import { redirect } from 'next/navigation';

import { DEFAULT_AUTHENTICATED_ROUTE } from '@/core/config/route.config';

// The auth guard on the destination sends anonymous visitors on to the login page.
export default function HomePage() {
  redirect(DEFAULT_AUTHENTICATED_ROUTE);
}
