'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/button';
import { Eye, EyeOff, Key, Lock } from 'lucide-react';

export default function ReestablecerForm() {
  const router = useRouter();
  const params = useSearchParams();

  const username = params.get('user') || '';
  const token = params.get('token') || '';

  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);

  useEffect(() => {
    async function validarToken() {
      if (!username || !token) {
        setError('Faltan datos en la URL.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/verificar-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, token }),
        });

        const data = await res.json();

        if (data.valid) {
          setTokenValido(true);
          setError('');
        } else {
          setTokenValido(false);
          setError(data.error || 'Token inválido o expirado.');
        }
      } catch {
        setTokenValido(false);
        setError('Error al validar token.');
      } finally {
        setLoading(false);
      }
    }
    validarToken();
  }, [username, token]);

  function validarPass(p: string) {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
    return re.test(p);
  }

  async function cambiar() {
    setError('');
    if (!validarPass(pwd)) {
      setError('La contraseña no cumple requisitos de seguridad.');
      return;
    }
    if (pwd !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      const res = await fetch('/api/cambiar-contrasena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, token, nuevaContrasena: pwd }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/login?passwordChanged=true');
      } else {
        setError(data.error || 'Error al actualizar la contraseña.');
      }
    } catch {
      setError('Error en la comunicación con el servidor.');
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center border border-[#E6E3DE]">
        <div className="flex justify-center">
          <svg className="animate-spin h-8 w-8 text-[#6B8E7B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="mt-4 text-[#6E7C72]">Validando token de seguridad...</p>
      </div>
    );
  }

  if (!tokenValido) {
    return (
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-[#E6E3DE]">
        <div className="bg-[#6B8E7B] p-6 text-white text-center border-b-2 border-[#F58634]">
          <div className="flex items-center justify-center space-x-2">
            <Lock className="h-6 w-6 text-[#F58634]" />
            <h2 className="text-xl font-bold">Token Inválido</h2>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-red-50 border-l-4 border-[#F58634] p-4 rounded">
            <p className="text-red-700">{error || 'El enlace de restablecimiento no es válido o ha expirado.'}</p>
          </div>
          <div className="mt-6">
            <Button 
              onClick={() => router.push('/login/recuperacion')}
              className="w-full bg-[#BD7D4A] hover:bg-[#F58634] text-white"
            >
              Solicitar nuevo enlace
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-[#E6E3DE]">
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#6B8E7B]/10 rounded-full"></div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#BD7D4A]/10 rounded-full"></div>
      </div>

      <div className="relative z-10">
        <div className="bg-[#6B8E7B] p-6 text-white text-center border-b-2 border-[#F58634]">
          <div className="flex items-center justify-center space-x-2">
            <Key className="h-6 w-6 text-[#F58634]" />
            <h2 className="text-xl font-bold">Nueva Contraseña</h2>
          </div>
          <p className="text-white/80 text-sm mt-1">
            Establece una nueva contraseña para tu cuenta
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); cambiar(); }} className="p-8 space-y-6">
          <div className="space-y-5">
            <div className="flex flex-col">
              <label htmlFor="nueva-contrasena" className="text-sm font-medium text-[#2C3E34] mb-1 flex items-center">
                <Lock className="h-4 w-4 text-[#6B8E7B] mr-2" />
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  id="nueva-contrasena"
                  type={showPwd ? 'text' : 'password'}
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  className="w-full border border-[#E6E3DE] rounded-lg px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-[#6B8E7B] focus:border-[#6B8E7B] focus:outline-none transition"
                  placeholder="Ingresa tu nueva contraseña"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E7C72] hover:text-[#2C3E34] transition"
                >
                  {showPwd ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="confirmar-contrasena" className="text-sm font-medium text-[#2C3E34] mb-1 flex items-center">
                <Lock className="h-4 w-4 text-[#6B8E7B] mr-2" />
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmar-contrasena"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full border border-[#E6E3DE] rounded-lg px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-[#6B8E7B] focus:border-[#6B8E7B] focus:outline-none transition"
                  placeholder="Repite tu nueva contraseña"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E7C72] hover:text-[#2C3E34] transition"
                >
                  {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#FAF9F7] border-l-4 border-[#6B8E7B] p-3 rounded">
            <p className="text-xs text-[#6E7C72]">
              <strong>Requisitos:</strong> Mínimo 8 caracteres, incluir mayúscula, minúscula, número y carácter especial.
            </p>
          </div>

          <div className="bg-[#FAF9F7] border-l-4 border-[#F58634] p-3 rounded">
            <p className="text-xs text-[#6E7C72]">
              <strong>Nota:</strong> Cuentas con 10 minutos para crear una nueva contraseña. Pasado ese tiempo esta URL dejará de ser funcional.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-[#F58634] p-3 rounded">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full py-3 bg-[#BD7D4A] hover:bg-[#F58634] text-white"
            >
              Actualizar contraseña
            </Button>
          </div>
        </form>

        <div className="bg-[#FAF9F7] px-8 py-4 border-t border-[#E6E3DE]">
          <p className="text-center text-xs text-[#6E7C72]">
            © {new Date().getFullYear()} Rubí Ramos - Sistema de gestión
          </p>
        </div>
      </div>
    </div>
  );
}