import { authenticateMobile } from '@/lib/mobile-auth';
import { mobileSuccess } from '@/lib/mobile-api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await authenticateMobile(request);
  if (!auth.ok) return auth.response;
  return mobileSuccess(auth.user);
}
