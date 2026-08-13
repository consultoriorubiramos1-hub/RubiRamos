import { Suspense } from 'react';
import ReestablecerForm from '@/components/login/reestablecer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Restablecer Contraseña',
  description: 'Establece una nueva contraseña para tu cuenta AutoClick',
};

export default function ReestablecerPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f8ff] to-[#e6f2ff] p-4">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-[#1e343b]">Cargando formulario de restablecimiento...</p>
        </div>
      }>
        <ReestablecerForm />
      </Suspense>
    </main>
  );
}