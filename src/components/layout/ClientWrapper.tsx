'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/header/header';
import Footer from '@/components/footer/footer';
import Breadcrumbs from '@/components/breadcrumbs';
import { ReactNode } from 'react';

export default function ClientWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="main-content flex-1">
        <Breadcrumbs />
        {children}
      </main>
      <Footer />
    </>
  );
}
