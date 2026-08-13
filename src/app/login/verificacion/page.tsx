import { Metadata } from 'next';
import VerificarForm from '@/components/login/verificacion';

export const metadata: Metadata = {
  title: 'Verificación de código',
  description: 'Verificación de seguridad en dos pasos para empleados de AutoClick',
};

export default function VerificarPage() {
  return (
    <div className="min-h-screen">
      <VerificarForm />
    </div>
  );
}