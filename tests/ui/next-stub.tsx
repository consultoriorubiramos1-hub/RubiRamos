// @ts-nocheck -- Browser-only adapter used exclusively by the isolated test bundle.
import React from 'react';

const params = new URLSearchParams(window.location.search);
const screen = params.get('screen') || '';
const patient = screen.startsWith('patient-') && screen !== 'patient-edit';
const router = { push: (url: string) => { window.__navigation = url; }, refresh: () => {}, replace: () => {} };
export const useRouter = () => router;
export const usePathname = () => patient ? '/admin/patient' : '/admin';
export const useSearchParams = () => params;
const session = { status: 'authenticated', data: { user: { id: '999999', rol_id: patient ? 2 : 1, username: 'cuenta_ficticia', email: 'pruebas@example.test' } } };
export const useSession = () => session;
export const signOut = () => { window.__navigation = '/login'; };
export const signIn = async () => ({ ok: true });
export const SessionProvider = ({ children }: { children: React.ReactNode }) => children;
export const redirect = () => {};

export default function NextPrimitive(props: Record<string, unknown>) {
  if ('src' in props) {
    const { fill, priority, quality, sizes, unoptimized, ...rest } = props;
    return <img {...rest} style={fill ? { position: 'absolute', width: '100%', height: '100%', inset: 0 } : undefined} />;
  }
  return <a {...props} />;
}
