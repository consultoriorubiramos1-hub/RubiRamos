import { Suspense, JSX } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getPosts } from '@/lib/posts-actions';
import { authConfig } from '@/lib/auth.config';
import PostsList from '@/components/muro/PostsList';

export const dynamic = 'force-dynamic';

export default async function MuroPage() {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    redirect('/login');
  }

  const userId = parseInt(session.user.id);
  const userRole = session.user.rol_id;
  const posts = await getPosts(undefined, userId);

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
        <Suspense fallback={<div className="p-6 text-center text-[#6E7C72]">Cargando publicaciones...</div>}>
          <PostsList initialPosts={posts} userId={userId} userRole={userRole} />
        </Suspense>
    </div>
  );
}