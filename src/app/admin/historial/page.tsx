import { Suspense } from 'react';
import MedicalHistoryClient from '@/components/medical-history/MedicalHistoryClient';

interface PageProps {
  searchParams?: {
    patientId?: string;
    patientName?: string;
    patientEmail?: string;
    patientAge?: string;
    patientGender?: string;
    patientPhone?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function MedicalHistoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  let preselectedPatient = null;

  if (params?.patientId) {
    preselectedPatient = {
      id: parseInt(params.patientId),
      nombre_completo: params.patientName || '',
      email: params.patientEmail || '',
      age: params.patientAge ? parseInt(params.patientAge) : null,
      gender: params.patientGender || '',
      phone: params.patientPhone || '',
      fecha_nacimiento: null,
      estado_civil: null,
      ocupacion: null
    };
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Suspense fallback={<div className="p-6 text-center text-[#6E7C72]">Cargando historial médico...</div>}>
        <MedicalHistoryClient preselectedPatient={preselectedPatient} />
      </Suspense>
    </div>
  );
}