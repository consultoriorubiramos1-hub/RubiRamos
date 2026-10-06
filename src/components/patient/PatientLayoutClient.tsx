'use client';

import { useState, useRef, useEffect } from 'react';
import SideNav from "@/components/dashboard/sidenav";
import { Bars3Icon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';

export default function PatientLayoutClient({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest('[aria-controls="patient-mobile-menu"]')) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <div className="workspace-shell flex min-h-dvh flex-col lg:h-dvh lg:flex-row" style={{ backgroundColor: '#FAF9F7' }}>
        {/* Header móvil */}
        <header className="relative flex shrink-0 items-center justify-between p-4 lg:hidden shadow-sm"
          onKeyDown={event => {
            if (event.key === 'Escape') {
              setIsMenuOpen(false);
              event.currentTarget.querySelector<HTMLButtonElement>('[aria-controls="patient-mobile-menu"]')?.focus();
            }
          }}
          style={{ 
            backgroundColor: '#5A8C7A',
            color: '#FFFFFF'
          }}
        >
          <Link href="/admin/patient" className="relative w-36 h-10">
            <Image 
              src="/logo_rubi.png" 
              fill 
              alt="RubiRamos Logo" 
              className="object-contain"
              priority
            />
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="min-h-11 min-w-11 p-2 rounded-xl transition-colors hover:bg-white/10"
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMenuOpen}
            aria-controls="patient-mobile-menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {isMenuOpen && (
            <div
              ref={menuRef}
              id="patient-mobile-menu"
              className="workspace-mobile-menu absolute top-full inset-x-4 z-50 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-xl shadow-xl"
              style={{ 
                backgroundColor: '#2C3E34',
                border: '1px solid #5A8C7A'
              }}
            >
              <SideNav mobile onClose={() => setIsMenuOpen(false)} />
            </div>
          )}
        </header>

        {/* Sidebar escritorio */}
        <div className="hidden lg:flex w-64 flex-none flex-col overflow-y-auto shadow-sm" style={{ backgroundColor: '#2C3E34' }}>
          <SideNav />
        </div>

        {/* Contenido principal */}
        <main id="main-content" className="workspace-content min-w-0 flex-1 p-3 sm:p-4 lg:overflow-y-auto lg:p-8">
          <div className="mx-auto min-w-0 max-w-7xl">{children}</div>
        </main>
      </div>
    </>
  );
}
