'use client';

import { useState, useEffect } from 'react';
import { createPost, updatePost, uploadPostImages } from '@/lib/posts-actions';
import { toast } from 'react-hot-toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  post?: any;
  userId: number;
}

export default function CreatePostModal({ isOpen, onClose, onSuccess, post, userId }: CreatePostModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: ''
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [links, setLinks] = useState<{ url: string; title: string }[]>([{ url: '', title: '' }]);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        description: post.description || '',
        content: post.content || ''
      });
      if (post.images && post.images.length > 0) {
        const urls = post.images.map((img: any) => img.url);
        setExistingImages(urls);
        setImagePreviews(urls);
      }
      if (post.links && post.links.length > 0) {
        setLinks(post.links.map((link: any) => ({ url: link.url, title: link.title || '' })));
      } else {
        setLinks([{ url: '', title: '' }]);
      }
    } else {
      resetForm();
    }
  }, [post]);

  const resetForm = () => {
    setFormData({ title: '', description: '', content: '' });
    setImageFiles([]);
    setExistingImages([]);
    setImagePreviews([]);
    setLinks([{ url: '', title: '' }]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = imageFiles.length + existingImages.length + files.length;
    
    if (totalImages > 5) {
      toast.error('Máximo 5 imágenes por publicación');
      return;
    }
    
    setImageFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      const newIndex = existingImages.length + index;
      setImageFiles(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((_, i) => i !== newIndex));
    }
  };

  const addLink = () => {
    setLinks(prev => [...prev, { url: '', title: '' }]);
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: 'url' | 'title', value: string) => {
    setLinks(prev => prev.map((link, i) => i === index ? { ...link, [field]: value } : link));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let allImageUrls: string[] = [...existingImages];
      
      if (imageFiles.length > 0) {
        const formDataImg = new FormData();
        imageFiles.forEach(file => {
          formDataImg.append('images', file);
        });
        const uploadResult = await uploadPostImages(formDataImg);
        if (uploadResult.success) {
          allImageUrls = [...allImageUrls, ...uploadResult.urls];
        }
      }
      
      const validLinks = links.filter(link => link.url.trim());
      
      if (post) {
        await updatePost(post.id, {
          title: formData.title,
          description: formData.description,
          content: formData.content,
          image_urls: allImageUrls.length > 0 ? allImageUrls : undefined,
          links: validLinks.length > 0 ? validLinks : undefined
        });
        toast.success('Publicación actualizada');
      } else {
        await createPost({
          title: formData.title,
          description: formData.description,
          content: formData.content,
          created_by: userId,
          image_urls: allImageUrls.length > 0 ? allImageUrls : undefined,
          links: validLinks.length > 0 ? validLinks : undefined
        });
        toast.success('Publicación creada');
      }
      
      onSuccess();
    } catch (error) {
      toast.error('Error al guardar la publicación');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#E6E3DE]">
        <div className="sticky top-0 bg-white border-b border-[#E6E3DE] px-6 py-4 bg-[#FAF9F7] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#5A8C7A]">
            {post ? 'Editar Publicación' : 'Nueva Publicación'}
          </h2>
          <button onClick={onClose} className="text-[#6E7C72] hover:text-[#2C3E34]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Título (opcional)</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A]"
              placeholder="Título de la publicación"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Descripción (opcional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A]"
              placeholder="Breve descripción"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Contenido (opcional)</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A]"
              placeholder="Escribe aquí el contenido de tu publicación..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Imágenes (máximo 5)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg"
            />
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${idx + 1}`}
                      className="h-20 w-full object-cover rounded-lg border border-[#E6E3DE]"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx, idx < existingImages.length)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-[#6E7C72] mt-1">Formatos: JPG, PNG, GIF. Maximo 5MB por imagen.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Enlaces (opcional)</label>
            {links.map((link, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(idx, 'url', e.target.value)}
                  placeholder="URL"
                  className="flex-1 px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A]"
                />
                <input
                  type="text"
                  value={link.title}
                  onChange={(e) => updateLink(idx, 'title', e.target.value)}
                  placeholder="Titulo (opcional)"
                  className="flex-1 px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A]"
                />
                {links.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    className="px-3 py-2 text-[#F58634] hover:text-[#BD7D4A]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addLink}
              className="text-sm text-[#5A8C7A] hover:text-[#4A7C6A]"
            >
              + Agregar otro enlace
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E6E3DE]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E6E3DE] rounded-lg text-[#6E7C72] hover:bg-[#FAF9F7]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] disabled:opacity-50"
            >
              {loading ? 'Guardando...' : (post ? 'Actualizar' : 'Publicar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}