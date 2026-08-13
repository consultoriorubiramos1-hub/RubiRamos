import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authConfig } from '@/lib/auth.config';
import { getPatientProfile } from '@/lib/patient-profile-actions';
import PatientProfileForm from '@/components/patient-profile/PatientProfileForm';

export const dynamic = 'force-dynamic';

export default async function PatientProfilePage() {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    redirect('/login');
  }

  // Verificar que sea paciente
  if (session.user.rol_id !== 2) {
    redirect('/dashboard');
  }

  const userId = parseInt(session.user.id);
  const profile = await getPatientProfile(userId);

  if (!profile) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<div className="text-center py-8 text-[#6E7C72]">Cargando perfil...</div>}>
          <PatientProfileForm initialProfile={profile} userId={userId} />
        </Suspense>
      </div>
    </div>
  );
}