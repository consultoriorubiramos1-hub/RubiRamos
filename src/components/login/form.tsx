'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/button';
import { Eye, EyeOff, BriefcaseMedical, Lock, User, HelpCircle, AlertTriangle } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      setError('No tienes permisos para acceder a esta página');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      try {
        const sessionResponse = await fetch('/api/auth/session');
        const session = await sessionResponse.json();
        
        if (session?.user?.rol_id === 1) {
          router.push('/admin');
        } else if (session?.user?.rol_id === 2) {
          router.push('/admin/patient');
        } else {
          setError('Rol de usuario no válido');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error al obtener sesión:', error);
        setError('Error al obtener información del usuario');
        setLoading(false);
      }
    }
  }

  return (
    <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-[#E6E3DE]">
      {/* Fondos decorativos */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#6B8E7B]/10 rounded-full"></div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#BD7D4A]/10 rounded-full"></div>
      </div>

      <div className="relative z-10">
        <div className="bg-[#6B8E7B] p-6 text-white border-b-2 border-[#F58634]">
          <div className="flex items-center justify-center space-x-3">
            <BriefcaseMedical className="h-8 w-8 text-[#F58634]" />
            <h2 className="text-2xl font-bold">Rubí Ramos</h2>
          </div>
          <p className="text-center text-white/80 text-sm mt-1">
            Sistema Integral de Gestión
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h3 className="text-xl font-semibold text-[#2C3E34] text-center">
            Iniciar sesión
          </h3>
          <p className="text-center text-sm text-[#6E7C72] pb-2">
            Acceso exclusivo para personal autorizado
          </p>

          <div className="space-y-5">
            <div className="flex flex-col relative">
              <label htmlFor="usuario" className="text-sm font-medium text-[#2C3E34] mb-1 flex items-center">
                <User className="h-4 w-4 text-[#6B8E7B] mr-2" />
                Usuario
              </label>
              <input
                id="usuario"
                type="text"
                value={username}
                onChange={e => setUsuario(e.target.value)}
                required
                className="w-full border border-[#E6E3DE] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#6B8E7B] focus:border-[#6B8E7B] focus:outline-none transition"
                placeholder="Ingresa tu usuario"
                disabled={loading}
              />
            </div>

            <div className="flex flex-col relative">
              <label htmlFor="contrasena" className="text-sm font-medium text-[#2C3E34] mb-1 flex items-center">
                <Lock className="h-4 w-4 text-[#6B8E7B] mr-2" />
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="contrasena"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full border border-[#E6E3DE] rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#6B8E7B] focus:border-[#6B8E7B] focus:outline-none transition pr-10"
                  placeholder="Ingresa tu contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E7C72] hover:text-[#2C3E34] transition"
                  tabIndex={-1}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-[#F58634] p-3 rounded flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-[#F58634] flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-1">
            <Link
              href="/login/recuperacion"
              className="text-sm text-[#6B8E7B] hover:text-[#F58634] transition flex items-center"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full py-3 bg-[#BD7D4A] hover:bg-[#F58634] text-white transition-colors shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : 'Iniciar sesión'}
            </Button>
          </div>
        </form>

        <div className="bg-[#FAF9F7] px-8 py-4 border-t border-[#E6E3DE]">
          <p className="text-center text-xs text-[#6E7C72]">
            © {new Date().getFullYear()} Rubí Ramos - Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}