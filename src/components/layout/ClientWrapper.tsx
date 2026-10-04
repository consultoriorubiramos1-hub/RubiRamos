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
      <main id="main-content" className="main-content min-w-0 flex-1">
        <Breadcrumbs />
        {children}
      </main>
      <Footer />
    </>
  );
}
