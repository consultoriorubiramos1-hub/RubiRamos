import { Metadata } from 'next';
import RecuperacionForm from '@/components/login/recuperacion';

export const metadata: Metadata = {
  title: 'Recuperación de Contraseña',
  description: 'Restablece tu contraseña de acceso al sistema AutoClick',
};

export default function RecuperacionPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f8ff] to-[#e6f2ff] p-4">
      <RecuperacionForm />
    </main>
  );
}