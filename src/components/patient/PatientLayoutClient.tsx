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

      <div className="flex h-screen flex-col lg:flex-row lg:overflow-hidden" style={{ backgroundColor: '#FAF9F7' }}>
        {/* Header móvil */}
        <header className="flex items-center justify-between p-4 lg:hidden shadow-sm" 
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
            className="p-2 rounded-md transition-colors hover:bg-white/10"
            aria-label="Abrir menú"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {isMenuOpen && (
            <div
              ref={menuRef}
              className="absolute top-16 right-4 z-50 w-64 rounded-lg shadow-xl"
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
        <div className="hidden lg:flex w-64 flex-none flex-col shadow-lg" style={{ backgroundColor: '#2C3E34' }}>
          <SideNav />
        </div>

        {/* Contenido principal */}
        <main className="flex-grow p-4 lg:overflow-y-auto lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </>
  );
}