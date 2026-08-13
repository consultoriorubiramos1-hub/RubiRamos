import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getPosts } from '@/lib/posts-actions';
import { authConfig } from '@/lib/auth.config';
import PatientPostsList from '@/components/patient-muro/PatientPostsList';

export const dynamic = 'force-dynamic';

export default async function PatientMuroPage() {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    redirect('/login');
  }

  // Verificar que sea paciente (rol_id = 2)
  if (session.user.rol_id !== 2) {
    redirect('/dashboard');
  }

  const userId = parseInt(session.user.id);
  const posts = await getPosts(undefined, userId);

  return (
    <div className="min-h-screen bg-[#FAF9F7] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<div className="text-center py-8 text-[#6E7C72]">Cargando publicaciones...</div>}>
          <PatientPostsList initialPosts={posts} userId={userId} />
        </Suspense>
      </div>
    </div>
  );
}