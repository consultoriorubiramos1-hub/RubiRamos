'use client';

import Link from 'next/link';
import NavLinks from '@/components/dashboard/nav-links';
import Image from 'next/image';
import { ArrowLeftEndOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { signOut, useSession } from 'next-auth/react';

interface SideNavProps {
  mobile?: boolean;
  onClose?: () => void;
}

export default function SideNav({ mobile = false, onClose }: SideNavProps) {
  const { data: session } = useSession();
  const handleClick = () => {
    if (onClose) onClose();
  };

  const userRole = session?.user?.rol_id || 1;
  const userName = session?.user?.username || session?.user?.email || 'Usuario';
  const isAdmin = userRole === 1;

  return (
    <div className={`workspace-sidebar flex flex-col ${mobile ? 'h-auto' : 'h-full'}`}>
      {/* Logo - solo en desktop */}
      {!mobile && (
        <div className="sidebar-brand flex flex-col items-center justify-center px-4 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,.12)' }}>
          <div className="relative w-44 h-14">
            <Image
              src="/logo_rubi.png"
              fill
              alt="RubiRamos Logo"
              priority
              className="object-contain"
            />
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-[.18em] text-[#E6E3DE]">{isAdmin ? 'Gestión del consultorio' : 'Tu espacio de bienestar'}</p>
        </div>
      )}

      {/* Contenido de navegación - crece para ocupar espacio disponible */}
      <div className="flex-grow px-3 py-4">
        <NavLinks mobile={mobile} onLinkClick={handleClick} userRole={userRole} />
      </div>

      {/* Botón cerrar sesión */}
      <div className="px-3 py-3 border-t" style={{ borderColor: '#5A8C7A' }}>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={`sidebar-signout flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors w-full ${
            mobile 
              ? 'hover:bg-red-600/20 justify-center' 
              : 'hover:bg-red-600/20 justify-start'
          }`}
          style={{ color: '#FFFFFF' }}
        >
          <ArrowLeftEndOnRectangleIcon className="h-5 w-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* Perfil - al final */}
      <div className="px-3 py-4 border-t" style={{ borderColor: '#5A8C7A' }}>
        <div className="sidebar-profile flex items-center gap-3 p-3 rounded-lg"
          style={{ 
            backgroundColor: 'rgba(255,255,255,.07)'
          }}
        >
          <div className="h-10 w-10 rounded-full flex items-center justify-center" 
            style={{ 
              backgroundColor: mobile ? '#5A8C7A' : 'rgba(255, 255, 255, 0.2)'
            }}
          >
            <UserCircleIcon className="h-6 w-6" style={{ color: '#FFFFFF' }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
              {isAdmin ? 'Lic. Rubí Ramos' : userName.split('@')[0]}
            </p>
            <p className="text-xs" style={{ color: '#A8CF45' }}>
              {isAdmin ? 'Nutrióloga' : 'Paciente'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
