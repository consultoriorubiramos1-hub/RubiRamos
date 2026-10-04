import { authenticateMobile } from '@/lib/mobile-auth';
import { mobileError, mobileSuccess } from '@/lib/mobile-api';

export const dynamic = 'force-dynamic';

interface MobilePostRow {
  id: number;
  title: string | null;
  description: string | null;
  content: string | null;
  created_at: Date | string;
  images: { id: number; url: string; order: number }[];
  links: { id: number; url: string; title: string | null; order: number }[];
  likes_count: number;
  user_has_liked: boolean;
}

export async function GET(request: Request) {
  const auth = await authenticateMobile(request);
  if (!auth.ok) return auth.response;
  const search = new URL(request.url).searchParams.get('search') ?? '';
  if (search.length > 100) return mobileError(400, 'La búsqueda no puede superar 100 caracteres.');
  try {
    const { getPosts } = await import('@/lib/posts-actions');
    const posts = await getPosts(search, auth.userId) as unknown as MobilePostRow[];
    return mobileSuccess(posts.map(post => ({
      id: post.id,
      title: post.title,
      description: post.description,
      content: post.content,
      created_at: post.created_at,
      images: post.images,
      links: post.links,
      likes_count: post.likes_count,
      user_has_liked: post.user_has_liked,
    })));
  } catch (error) {
    console.error('Error al consultar muro móvil:', error);
    return mobileError(500, 'No se pudo consultar el muro.');
  }
}
