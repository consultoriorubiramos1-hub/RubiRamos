import { authenticateMobile } from '@/lib/mobile-auth';
import { mobileError, mobileSuccess, positiveId } from '@/lib/mobile-api';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticateMobile(request);
  if (!auth.ok) return auth.response;
  const postId = positiveId((await context.params).id);
  if (!postId) return mobileError(400, 'Identificador de publicación inválido.');
  try {
    const { getPosts, toggleLikePost } = await import('@/lib/posts-actions');
    const posts = await getPosts(undefined, auth.userId) as unknown as { id: number; user_has_liked: boolean }[];
    const post = posts.find(item => Number(item.id) === postId);
    if (!post) return mobileError(404, 'Publicación no encontrada.');
    await toggleLikePost(postId, auth.userId);
    return mobileSuccess({ liked: !post.user_has_liked });
  } catch (error) {
    console.error('Error al marcar publicación móvil:', error);
    return mobileError(500, 'No se pudo procesar el like.');
  }
}
