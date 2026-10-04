"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { 
  FaHome, 
  FaUserAlt, 
  FaShoppingBag, 
  FaBars,
  FaTimes,
  FaUserCircle,
  FaSignOutAlt
} from 'react-icons/fa';
import styles from './header.module.css';

const Header = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = status === 'authenticated';
  const userRole = session?.user?.rol_id;
  const userName = session?.user?.username || session?.user?.email || 'Usuario';

  // Determinar la ruta del perfil según el rol
  const profilePath = userRole === 1 ? '/admin' : userRole === 2 ? '/admin/patient' : '/';

  const isActive = (path: string) => pathname === path;

  // Cerrar menú móvil al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest('[aria-controls="public-mobile-menu"]')) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Cerrar menú de usuario al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const navLinks = [
    { href: '/', icon: FaHome, label: 'Inicio' },
    { href: '/catalog', icon: FaShoppingBag, label: 'Catálogo' },
    //{ href: '/calendar', icon: FaCalendarAlt, label: 'Agendar Cita' },
  ];

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
    setIsUserMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logoContainer}>
          <Link href="/">
            <Image
              src="/logo_rubi.png"
              alt="RubiRamos Logo"
              width={270}
              height={50}
              priority
              className={styles.logo}
            />
          </Link>
        </div>

        {/* Botón menú móvil */}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMenuOpen}
          aria-controls="public-mobile-menu"
        >
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

        {/* Navegación escritorio */}
        <nav className={styles.desktopNav} aria-label="Navegación principal">
          <ul className={styles.navList}>
            {navLinks.map((link) => (
              <li key={link.href} className={styles.navItem}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`${styles.navLink} ${isActive(link.href) ? styles.active : ""}`}
                >
                  <link.icon size={20} className={styles.icon} />
                  <span>{link.label}</span>
                  {isActive(link.href) && (
                    <div className={styles.activeIndicator}></div>
                  )}
                </Link>
              </li>
            ))}
            
            {/* Enlace de Perfil/Login con menú desplegable si está autenticado */}
            <li className={styles.navItem}>
              {isAuthenticated ? (
                <div className={styles.userMenuContainer} ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    aria-expanded={isUserMenuOpen}
                    aria-controls="public-user-menu"
                    className={`${styles.navLink} ${isActive(profilePath) ? styles.active : ''}`}
                  >
                    <FaUserCircle size={20} className={styles.icon} />
                    <span>{userName.split('@')[0]}</span>
                    {isActive(profilePath) && <div className={styles.activeIndicator}></div>}
                  </button>
                  
                  {isUserMenuOpen && (
                    <div id="public-user-menu" className={styles.userDropdown}>
                      <Link 
                        href={profilePath}
                        className={styles.dropdownItem}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <FaUserCircle size={16} />
                        <span>Mi Perfil</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className={styles.dropdownItem}
                      >
                        <FaSignOutAlt size={16} />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className={`${styles.navLink} ${isActive('/login') ? styles.active : ''}`}
                >
                  <FaUserAlt size={20} className={styles.icon} />
                  <span>Iniciar Sesión</span>
                  {isActive('/login') && <div className={styles.activeIndicator}></div>}
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>

      {/* Menú móvil desplegable */}
      {isMenuOpen && (
        <div id="public-mobile-menu" ref={menuRef} className={styles.mobileMenu}>
          <div className={styles.mobileMenuContent}>
            <ul className={styles.mobileNavList}>
              {navLinks.map((link) => (
                <li key={link.href} className={styles.mobileNavItem}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.mobileActive : ""}`}
                  >
                    <link.icon size={20} className={styles.mobileIcon} />
                    <span>{link.label}</span>
                    {isActive(link.href) && (
                      <div className={styles.mobileActiveIndicator}></div>
                    )}
                  </Link>
                </li>
              ))}
              
              {/* Enlace de Perfil/Login en móvil */}
              <li className={styles.mobileNavItem}>
                {isAuthenticated ? (
                  <>
                    <Link 
                      href={profilePath}
                      onClick={() => setIsMenuOpen(false)}
                      className={`${styles.mobileNavLink} ${isActive(profilePath) ? styles.mobileActive : ''}`}
                    >
                      <FaUserCircle size={20} className={styles.mobileIcon} />
                      <span>{userName.split('@')[0]}</span>
                      {isActive(profilePath) && <div className={styles.mobileActiveIndicator}></div>}
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className={`${styles.mobileNavLink} ${styles.mobileLogout}`}
                    >
                      <FaSignOutAlt size={20} className={styles.mobileIcon} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className={`${styles.mobileNavLink} ${isActive('/login') ? styles.mobileActive : ''}`}
                  >
                    <FaUserAlt size={20} className={styles.mobileIcon} />
                    <span>Iniciar Sesión</span>
                    {isActive('/login') && <div className={styles.mobileActiveIndicator}></div>}
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
