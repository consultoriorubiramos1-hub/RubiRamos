'use client';

import { useState, useEffect } from 'react';
import { getPosts, toggleLikePost } from '@/lib/posts-actions';
import PatientImageCarousel from './PatientImageCarousel';
import { toast } from 'react-hot-toast';

interface PatientPostsListProps {
  initialPosts?: any[];
  userId: number;
}

export default function PatientPostsList({ initialPosts = [], userId }: PatientPostsListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getPosts(searchTerm, userId);
      setPosts(data);
    } catch (error) {
      toast.error('Error al cargar publicaciones');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleLike = async (postId: number) => {
    try {
      await toggleLikePost(postId, userId);
      // Actualizar el estado localmente para mejor experiencia
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const hasLiked = !post.user_has_liked;
            return {
              ...post,
              user_has_liked: hasLiked,
              likes_count: hasLiked ? post.likes_count + 1 : post.likes_count - 1
            };
          }
          return post;
        })
      );
    } catch (error) {
      toast.error('Error al procesar like');
    }
  };

  const formatDateTime = (date: string | Date, showEdit: boolean = false, updatedDate?: string | Date) => {
    const d = new Date(date);
    const offset = -6;
    const localDate = new Date(d.getTime() + (offset * 60 * 60 * 1000));
    
    const formattedDate = localDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = localDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    if (showEdit && updatedDate && date !== updatedDate) {
      const updated = new Date(updatedDate);
      const localUpdated = new Date(updated.getTime() + (offset * 60 * 60 * 1000));
      const updatedFormattedDate = localUpdated.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const updatedFormattedTime = localUpdated.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${formattedDate} a las ${formattedTime} (editado: ${updatedFormattedDate} a las ${updatedFormattedTime})`;
    }
    
    return `${formattedDate} a las ${formattedTime}`;
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#5A8C7A]">Muro de Difusión</h1>
        <p className="text-sm text-[#6E7C72] mt-1">
          Información importante y anuncios del Consultorio Nutricional
        </p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar publicaciones por título o descripción..."
          className="w-full pl-10 pr-4 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent bg-white"
        />
        <svg className="absolute left-3 top-2.5 h-5 w-5 text-[#6E7C72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Lista de publicaciones */}
      {loading ? (
        <div className="text-center py-8 text-[#6E7C72]">Cargando publicaciones...</div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-[#6E7C72] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="text-[#6E7C72]">No hay publicaciones disponibles</p>
          <p className="text-sm text-[#6E7C72] mt-2">Pronto habrá novedades del consultorio</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden transition-all hover:shadow-md">
              {/* Cabecera */}
              <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
                <h2 className="text-xl font-bold text-[#5A8C7A]">{post.title || 'Sin título'}</h2>
                <div className="flex flex-wrap gap-3 text-xs text-[#6E7C72] mt-2">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {post.username}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {post.updated_at && post.updated_at !== post.created_at 
                      ? formatDateTime(post.created_at, true, post.updated_at)
                      : formatDateTime(post.created_at)
                    }
                  </span>
                </div>
              </div>

              {/* Descripción */}
              {post.description && (
                <div className="px-6 pt-5">
                  <p className="text-[#6E7C72] text-base italic border-l-4 border-[#BD7D4A] pl-4">
                    {post.description}
                  </p>
                </div>
              )}

              {/* Contenido */}
              {post.content && (
                <div className="px-6 py-4">
                  <div className="text-[#2C3E34] whitespace-pre-wrap text-base leading-relaxed">
                    {post.content.split('\n').map((paragraph: string, idx: number) => (
                      <p key={idx} className="mb-3 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Imágenes */}
              {post.images && post.images.length > 0 && (
                <div className="px-6 pb-4">
                  <PatientImageCarousel images={post.images} />
                </div>
              )}

              {/* Enlaces */}
              {post.links && post.links.length > 0 && (
                <div className="px-6 pb-4">
                  <div className="space-y-2">
                    {post.links.map((link: any) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#27ADF5] hover:text-[#F58634] transition-colors group"
                      >
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {link.title || link.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón de like */}
              <div className="px-6 py-4 border-t border-[#E6E3DE] bg-[#FAF9F7]">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 transition-all duration-200 group ${
                    post.user_has_liked 
                      ? 'text-[#F58634]' 
                      : 'text-[#6E7C72] hover:text-[#F58634]'
                  }`}
                >
                  <svg 
                    className="w-5 h-5 transition-transform group-hover:scale-110" 
                    fill={post.user_has_liked ? 'currentColor' : 'none'} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
                  </span>
                  {!post.user_has_liked && (
                    <span className="text-xs text-[#6E7C72] opacity-0 group-hover:opacity-100 transition-opacity">
                      Me gusta
                    </span>
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}