'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: number[];
}

export default function ProtectedRoute({ children, allowedRoles = [1, 2] }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && allowedRoles && !allowedRoles.includes(session.user?.rol_id)) {
      router.push('/login?error=unauthorized');
    }
  }, [session, status, router, allowedRoles]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5A8C7A] mx-auto"></div>
          <p className="mt-4 text-[#6E7C72]">Cargando...</p>
        </div>
      </div>
    );
  }

  if (session && allowedRoles.includes(session.user?.rol_id)) {
    return <>{children}</>;
  }

  return null;
}