'use client';

import { useState, useEffect } from 'react';
import { getPosts, deletePost, toggleLikePost } from '@/lib/posts-actions';
import CreatePostModal from './CreatePostModal';
import ImageCarousel from './ImageCarousel';
import { toast } from 'react-hot-toast';

interface PostsListProps {
  initialPosts?: any[];
  userId: number;
  userRole?: number;
}

export default function PostsList({ initialPosts = [], userId, userRole = 1 }: PostsListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; postId: number | null; postTitle: string }>({
    isOpen: false,
    postId: null,
    postTitle: ''
  });
  const isAdmin = userRole === 1;

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getPosts(searchTerm, userId);
      setPosts(data);
    } catch (error) {
      toast.error('Error al cargar publicaciones');
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

  const handleDeleteClick = (id: number, title: string) => {
    setDeleteConfirm({
      isOpen: true,
      postId: id,
      postTitle: title || 'esta publicación'
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm.postId) {
      try {
        await deletePost(deleteConfirm.postId);
        toast.success('Publicación eliminada');
        loadPosts();
      } catch (error) {
        toast.error('Error al eliminar publicación');
      } finally {
        setDeleteConfirm({ isOpen: false, postId: null, postTitle: '' });
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, postId: null, postTitle: '' });
  };

  const handleLike = async (postId: number) => {
    try {
      await toggleLikePost(postId, userId);
      loadPosts();
    } catch (error) {
      toast.error('Error al procesar like');
    }
  };

  const handleEdit = (post: any) => {
    if (!isAdmin) return;
    setEditingPost(post);
    setModalOpen(true);
  };

  const handlePostSaved = () => {
    loadPosts();
    setModalOpen(false);
    setEditingPost(null);
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
    <>
      <div className="space-y-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#5A8C7A]">Muro de Difusión</h1>
          <p className="text-sm text-[#6E7C72] mt-1">Comparte información importante con los pacientes</p>
        </div>

        <div className="flex justify-between items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar publicaciones por título o descripción..."
                className="w-full pl-10 pr-4 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-[#6E7C72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingPost(null);
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] transition-colors font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Publicación
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8 text-[#6E7C72]">Cargando publicaciones...</div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-8 text-center">
            <p className="text-[#6E7C72]">No hay publicaciones aún</p>
            {isAdmin && (
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 text-[#BD7D4A] hover:text-[#F58634] font-semibold"
              >
                Crear la primera publicación
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
                <div className="bg-[#FAF9F7] px-8 py-5 border-b border-[#E6E3DE] flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#5A8C7A]">{post.title || 'Sin título'}</h3>
                    <div className="flex flex-wrap gap-3 text-xs text-[#6E7C72] mt-2">
                      <span>Por: {post.username}</span>
                      <span>
                        {post.updated_at && post.updated_at !== post.created_at 
                          ? formatDateTime(post.created_at, true, post.updated_at)
                          : formatDateTime(post.created_at)
                        }
                      </span>
                      <span>{post.views_count} vistas</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(post)}
                        className="text-[#5A8C7A] hover:text-[#4A7C6A] transition-colors"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(post.id, post.title)}
                        className="text-[#F58634] hover:text-[#BD7D4A] transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {post.description && (
                  <div className="px-8 pt-5">
                    <p className="text-[#6E7C72] text-base italic">{post.description}</p>
                  </div>
                )}

                {post.content && (
                  <div className="px-8 py-4">
                    <p className="text-[#2C3E34] whitespace-pre-wrap text-base leading-relaxed">{post.content}</p>
                  </div>
                )}

                {post.images && post.images.length > 0 && (
                  <div className="px-8 pb-4">
                    <ImageCarousel images={post.images} />
                  </div>
                )}

                {post.links && post.links.length > 0 && (
                  <div className="px-8 pb-4">
                    <div className="space-y-2">
                      {post.links.map((link: any) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[#27ADF5] hover:text-[#F58634] transition-colors"
                        >
                          {link.title || link.url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-8 py-4 border-t border-[#E6E3DE] flex items-center gap-2">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 transition-colors ${
                      post.user_has_liked ? 'text-[#F58634]' : 'text-[#6E7C72] hover:text-[#F58634]'
                    }`}
                  >
                    <svg className="w-5 h-5" fill={post.user_has_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAdmin && (
          <CreatePostModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditingPost(null);
            }}
            onSuccess={handlePostSaved}
            post={editingPost}
            userId={userId}
          />
        )}
      </div>

      {/* Modal de confirmación para eliminar */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-[#E6E3DE]">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#F58634]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#2C3E34] text-center mb-2">
                ¿Eliminar publicación?
              </h3>
              <p className="text-sm text-[#6E7C72] text-center mb-6">
                ¿Estás seguro de que deseas eliminar la publicación <strong className="text-[#2C3E34]">"{deleteConfirm.postTitle}"</strong>?<br />
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 border border-[#E6E3DE] rounded-lg text-[#6E7C72] hover:bg-[#FAF9F7] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-[#F58634] text-white rounded-lg hover:bg-[#BD7D4A] transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}