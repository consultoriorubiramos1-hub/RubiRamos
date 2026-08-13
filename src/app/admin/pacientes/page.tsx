import { Suspense } from 'react';
import { getPatients, getPatientsStats } from '@/lib/patients-actions';
import PatientsList from '@/components/patients/PatientList';

export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
  const [patientsResult, stats] = await Promise.all([
    getPatients({ page: 1, pageSize: 10 }),
    getPatientsStats()
  ]);

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Suspense fallback={<div className="p-6 text-center text-[#6E7C72]">Cargando pacientes...</div>}>
        <PatientsList 
          initialPatients={patientsResult.patients}
          initialTotal={patientsResult.total}
          initialStats={stats}
        />
      </Suspense>
    </div>
  );
}