'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { Mail, Clock, RefreshCw, ShieldCheck, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function VerificarForm() {
  const [codigo, setCodigo] = useState(Array(6).fill(''));
  const [counter, setCounter] = useState(180);
  const [email, setEmail] = useState('');
  const [username, setUsuario] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  const enviado = useRef(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const storedUsuario = sessionStorage.getItem('usuario');

    if (storedUsuario && !enviado.current) {
      enviado.current = true;
      setUsuario(storedUsuario);

      fetch('/api/enviar-codigo', {
        method: 'POST',
        body: JSON.stringify({ usuario: storedUsuario }),
        headers: { 'Content-Type': 'application/json' },
      })
        .then(res => res.json())
        .then(data => {
          if (data.email) {
            setEmail(enmascararEmail(data.email));
          }
        });
    }
  }, []);

  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0]?.focus();
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function enmascararEmail(email: string) {
    const [local, domain] = email.split('@');
    const visible = local.slice(-3);
    return `${'*'.repeat(local.length - 3)}${visible}@${domain}`;
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '');
    
    if (digits.length === 6) {
      const newCodigo = digits.split('').slice(0, 6);
      setCodigo(newCodigo);
      setTimeout(() => {
        if (inputsRef.current[5]) {
          inputsRef.current[5]?.focus();
        }
      }, 10);
    }
  }

  function handleDigitChange(index: number, value: string) {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '');
      if (digits.length >= 6) {
        const newCodigo = digits.split('').slice(0, 6);
        setCodigo(newCodigo);
        setTimeout(() => {
          if (inputsRef.current[5]) {
            inputsRef.current[5]?.focus();
          }
        }, 10);
        return;
      }
    }
    
    if (!/^\d?$/.test(value)) return;
    
    const newCode = [...codigo];
    newCode[index] = value;
    setCodigo(newCode);

    if (value && index < 5) {
      setTimeout(() => {
        if (inputsRef.current[index + 1]) {
          inputsRef.current[index + 1]?.focus();
        }
      }, 10);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !codigo[index] && index > 0) {
      const prev = document.getElementById(`digit-${index - 1}`);
      if (prev) prev.focus();
    }
  }

  async function verificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setIsVerifying(true);
    setMensaje('');
    
    const fullCode = codigo.join('');
    const res = await fetch('/api/verificar-codigo', {
      method: 'POST',
      body: JSON.stringify({ username, code: fullCode }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    
    if (data.success) {
      router.push("/admin");
    } else {
      if (data.tipo === 'expirado') {
        setMensaje('El código ha expirado. Puedes solicitar uno nuevo.');
      } else if (data.tipo === 'codigo') {
        setMensaje('El código ingresado es incorrecto.');
      } else {
        setMensaje('Error al verificar el código.');
      }
    }
    setIsVerifying(false);
  }

  async function reenviarCodigo() {
    setIsResending(true);
    setCounter(180);
    setMensaje('');
    await fetch('/api/enviar-codigo', {
      method: 'POST',
      body: JSON.stringify({ username }),
      headers: { 'Content-Type': 'application/json' },
    });
    setIsResending(false);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAF9F7]">
      <div className="w-full lg:w-1/2 p-8 lg:p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <ShieldCheck className="h-8 w-8 text-[#6B8E7B]" />
              <h1 className="text-2xl font-bold text-[#6B8E7B]">Rubí Ramos</h1>
            </div>
            <h2 className="text-xl font-semibold text-[#2C3E34]">Verificación de Seguridad</h2>
            <p className="text-sm text-[#6E7C72] mt-2">
              Asegurando el acceso seguro a la información
            </p>
          </div>

          <form onSubmit={verificarCodigo} className="space-y-6">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center text-sm text-[#6E7C72]">
                <Mail className="h-5 w-5 mr-2 text-[#6B8E7B]" />
                <p>
                  Código enviado a: <b className="text-[#2C3E34]">{email}</b>
                </p>
              </div>
              
              <div className="flex items-center justify-center text-sm text-[#6E7C72]">
                <Clock className="h-5 w-5 mr-2 text-[#6B8E7B]" />
                <p>
                  Expira en: <b className="text-[#BD7D4A]">
                    {Math.floor(counter / 60)}:{(counter % 60).toString().padStart(2, '0')}
                  </b>
                </p>
              </div>
              
              <p className="text-sm text-[#6E7C72]">
                Ingresa el código de 6 dígitos que recibiste
              </p>
              <p className="text-xs text-[#6E7C72]">
                Puedes copiar y pegar todo el código de 6 dígitos en cualquier campo
              </p>
            </div>

            <div className="flex justify-center gap-3">
              {codigo.map((digit, idx) => (
                <input
                  title="Ingrese un dígito del código"
                  key={idx}
                  id={`digit-${idx}`}
                  ref={(el) => { inputsRef.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 text-2xl font-medium text-center border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#6B8E7B] focus:border-[#6B8E7B] transition"
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {mensaje && (
              <div className={`p-3 rounded-lg text-center text-sm font-medium ${
                mensaje.includes('incorrecto') || mensaje.includes('Error') 
                  ? 'bg-red-50 text-red-600 border-l-4 border-[#F58634]' 
                  : 'bg-blue-50 text-blue-600 border-l-4 border-[#6B8E7B]'
              }`}>
                {mensaje}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button
                type="button"
                onClick={reenviarCodigo}
                disabled={counter > 0 || isResending}
                variant="outline"
                className={counter > 0 ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isResending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Reenviar código
                  </>
                )}
              </Button>
              
              <Button 
                type="submit" 
                className="bg-[#BD7D4A] hover:bg-[#F58634] text-white flex items-center justify-center gap-2"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verificando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Verificar
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-4 border-t border-[#E6E3DE] text-center">
            <p className="text-xs text-[#6E7C72]">
              © {new Date().getFullYear()} Rubí Ramos - Sistema interno
            </p>
          </div>
        </div>
      </div>

      {/* Sección informativa */}
      <div className="w-full lg:w-1/2 p-8 lg:p-12 flex items-center justify-center bg-white">
        <div className="w-full max-w-md">
          <h3 className="text-2xl font-bold text-[#6B8E7B] mb-6">
            Sobre nuestro consultorio
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-[#6B8E7B] p-2 rounded-lg text-white flex-shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-[#2C3E34]">Confidencialidad</h4>
                <p className="text-[#6E7C72] mt-1">
                  Protegemos la privacidad de cada paciente, asegurando que su información médica y personal esté resguardada.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-[#6B8E7B] p-2 rounded-lg text-white flex-shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-[#2C3E34]">Atención profesional</h4>
                <p className="text-[#6E7C72] mt-1">
                  Brindamos orientación nutricional, emocional y física enfocada al bienestar integral del paciente.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-[#6B8E7B] p-2 rounded-lg text-white flex-shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-[#2C3E34]">Compromiso con la salud</h4>
                <p className="text-[#6E7C72] mt-1">
                  Promovemos hábitos saludables, prevención de enfermedades y mejora del estilo de vida.
                </p>
              </div>
            </div>
            
            <div className="bg-[#FAF9F7] p-4 rounded-lg border border-[#E6E3DE] shadow-sm mt-6">
              <p className="text-sm text-[#6E7C72]">
                <strong className="text-[#2C3E34]">Nota:</strong> Este sistema digital está diseñado para facilitar el registro, seguimiento y atención continua de cada paciente.
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-[#E6E3DE]">
              <p className="text-sm text-[#6E7C72]">
                ¿Tienes dudas sobre el sistema o tu expediente médico?
              </p>
              <p className="text-sm text-[#6B8E7B] font-medium mt-1">
                contacto@rubiramos.com | +52 55 1234 5678
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}