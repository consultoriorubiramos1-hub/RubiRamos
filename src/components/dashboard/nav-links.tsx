'use client';

import { useState } from 'react';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  IdentificationIcon,
  NumberedListIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon,
  SpeakerWaveIcon,
  BanknotesIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

// Enlaces para ADMIN (rol_id = 1)
const adminMainLinks = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Muro', href: '/admin/muro', icon: ClipboardDocumentCheckIcon },
  { name: 'Pacientes', href: '/admin/pacientes', icon: UserGroupIcon },
  { name: 'Citas', href: '/admin/appointments', icon: NumberedListIcon },
  { name: 'Pagos', href: '/admin/pagos', icon: BanknotesIcon },
  { name: 'Calendario', href: '/admin/calendar', icon: CalendarIcon },
  { name: 'Historial Médico', href: '/admin/historial', icon: IdentificationIcon },
  { name: 'Menús Alimenticios', href: '/admin/menus', icon: BookOpenIcon },
  { name: 'Productos', href: '/admin/productos', icon: ShoppingBagIcon },
];

// Enlaces para PACIENTE (rol_id = 2)
const patientMainLinks = [
  { name: 'Dashboard', href: '/admin/patient', icon: HomeIcon },
  { name: 'Muro', href: '/admin/patient/muro', icon: ClipboardDocumentCheckIcon },
  { name: 'Calendario', href: '/admin/patient/calendar', icon: CalendarIcon },
  { name: 'Historial Médico', href: '/admin/patient/historial', icon: IdentificationIcon },
];

// Enlaces de configuración para ADMIN
const adminConfigLinks = [
  {name: 'Alexa NutriControl',href: '/admin/alexa',icon: SpeakerWaveIcon},
  { name: 'Monitoreo', href: '/admin/monitoreo', icon: ChartBarIcon },
  { name: 'Respaldos', href: '/admin/db', icon: CircleStackIcon },
];

// Enlaces de configuración para PACIENTE
const patientConfigLinks = [
  { name: 'Perfil', href: '/admin/patient/perfil', icon: UserCircleIcon },
];

interface NavLinksProps {
  mobile?: boolean;
  onLinkClick?: () => void;
  userRole?: number;
}

export default function NavLinks({ mobile = false, onLinkClick, userRole = 1 }: NavLinksProps) {
  const pathname = usePathname();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Seleccionar enlaces según el rol
  const mainLinks = userRole === 1 ? adminMainLinks : patientMainLinks;
  const configLinks = userRole === 1 ? adminConfigLinks : patientConfigLinks;
  const isAdmin = userRole === 1;

  // Función para renderizar enlaces
  const renderLinks = (links: typeof adminMainLinks, sectionTitle?: string) => (
    <>
      {sectionTitle && !mobile && (
        <div className="px-1 pt-4 pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#A8CF45' }}>
            {sectionTitle}
          </h3>
        </div>
      )}
      {links.map((link) => {
        const LinkIcon = link.icon;
        const isActive = pathname === link.href || 
                        (link.href !== '/admin' && link.href !== '/admin/patient' && pathname.startsWith(link.href));

        return (
          <Link
            key={link.name}
            href={link.href}
            onClick={onLinkClick}
            className={clsx(
              'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 relative mb-1',
              isActive && 'font-semibold'
            )}
            style={
              mobile
                ? isActive
                  ? { 
                      backgroundColor: '#5A8C7A',
                      color: '#FFFFFF'
                    }
                  : { 
                      color: '#E6E3DE'
                    }
                : isActive
                ? { 
                    backgroundColor: '#5A8C7A',
                    color: '#FFFFFF'
                  }
                : { 
                    color: '#E6E3DE'
                  }
            }
          >
            {isActive && !mobile && (
              <div 
                className="absolute left-0 top-1/2 transform -translate-y-1/2 h-6 w-1 rounded-r"
                style={{ backgroundColor: '#F58634' }}
              ></div>
            )}
            
            <LinkIcon className="h-4 w-4" />
            <span>{link.name}</span>
          </Link>
        );
      })}
    </>
  );

  // Renderizar enlaces de configuración desplegables
  const renderConfigSection = () => {
    const isAnyConfigActive = configLinks.some(link => 
      pathname === link.href || pathname.startsWith(link.href)
    );

    return (
      <div className={!mobile ? 'mt-2' : ''}>
        {/* Botón de Configuración */}
        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className={clsx(
            'flex items-center justify-between w-full rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 mb-1',
            isAnyConfigActive && !mobile && 'font-semibold'
          )}
          style={{
            backgroundColor: isAnyConfigActive && !mobile ? '#5A8C7A' : 'transparent',
            color: '#E6E3DE'
          }}
        >
          <div className="flex items-center gap-3">
            <Cog6ToothIcon className="h-4 w-4" />
            <span>Configuración</span>
          </div>
          {isConfigOpen ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </button>

        {/* Enlaces de configuración (desplegables) */}
        {(isConfigOpen || mobile) && (
          <div className={clsx(
            'space-y-1',
            !mobile && 'pl-6 ml-2 border-l-2',
            mobile && 'mt-1'
          )}
          style={!mobile ? { borderColor: '#5A8C7A' } : {}}
          >
            {configLinks.map((link) => {
              const LinkIcon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href);

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={onLinkClick}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    isActive && 'font-semibold'
                  )}
                  style={
                    mobile
                      ? isActive
                        ? { 
                            backgroundColor: '#5A8C7A',
                            color: '#FFFFFF'
                          }
                        : { 
                            color: '#E6E3DE'
                          }
                      : isActive
                      ? { 
                          backgroundColor: '#5A8C7A',
                          color: '#FFFFFF'
                        }
                      : { 
                          color: '#E6E3DE'
                        }
                  }
                >
                  <LinkIcon className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="flex flex-col">
      {/* Enlaces principales */}
      {renderLinks(mainLinks, mobile ? undefined : 'Principal')}
      
      {/* Sección de Configuración desplegable */}
      {renderConfigSection()}
    </nav>
  );
}