import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getAuditoria } from '@/lib/auditoria';
import { authConfig } from '@/lib/auth.config';
import AuditoriaClient from '@/components/monitoreo/auditoria';
import MetricasCards from '@/components/monitoreo/metricasCards';

export const dynamic = 'force-dynamic';

export default async function AuditoriaPage() {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    redirect('/login');
  }

  const { data, total } = await getAuditoria(50, 0);

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#6B8E7B]">
            Dashboard de Monitoreo
          </h1>
          <p className="text-sm text-[#6E7C72] mt-1">
            Métricas de rendimiento y actividad de la base de datos
          </p>
        </div>
        
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-[#E6E3DE] rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-[#E6E3DE] rounded w-3/4"></div>
              </div>
            ))}
          </div>
        }>
          <MetricasCards />
        </Suspense>
        
        <div className="mt-8 mb-6">
          <h2 className="text-xl font-semibold text-[#6B8E7B]">
            Historial de Auditoría
          </h2>
          <p className="text-sm text-[#6E7C72] mt-1">
            Registro detallado de todas las operaciones realizadas en el sistema
          </p>
        </div>
        
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <div className="text-[#6E7C72]">Cargando historial de auditoría...</div>
          </div>
        }>
          <AuditoriaClient auditoriaInicial={data} total={total} />
        </Suspense>
      </div>
    </div>
  );
}