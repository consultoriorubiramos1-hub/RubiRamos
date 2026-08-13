'use client';

import { useState, useEffect } from 'react';
import { getRecommendations, createRecommendation, updateRecommendation, deleteRecommendation, reorderRecommendations, uploadRecommendationImage } from '@/lib/recommendations-actions';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function RecommendationsModal({ isOpen, onClose, onSave }: RecommendationsModalProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text' as 'text' | 'image'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null; title: string }>({
    isOpen: false,
    id: null,
    title: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadRecommendations();
    }
  }, [isOpen]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const data = await getAllRecommendations();
      setRecommendations(data);
    } catch (error) {
      toast.error('Error al cargar recomendaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let imageUrl = '';
      if (formData.type === 'image' && imageFile) {
        const formDataImg = new FormData();
        formDataImg.append('image', imageFile);
        const uploadResult = await uploadRecommendationImage(formDataImg);
        if (uploadResult.success) {
          imageUrl = uploadResult.url;
        }
      }
      
      if (editingId) {
        await updateRecommendation(editingId, {
          title: formData.title,
          content: formData.type === 'text' ? formData.content : undefined,
          image_url: formData.type === 'image' ? imageUrl : undefined,
          type: formData.type
        });
        toast.success('Recomendación actualizada');
      } else {
        await createRecommendation({
          title: formData.title,
          content: formData.type === 'text' ? formData.content : undefined,
          image_url: formData.type === 'image' ? imageUrl : undefined,
          type: formData.type
        });
        toast.success('Recomendación creada');
      }
      
      resetForm();
      loadRecommendations();
      if (onSave) onSave();
    } catch (error) {
      toast.error('Error al guardar recomendación');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ title: '', content: '', type: 'text' });
    setImageFile(null);
    setImagePreview('');
  };

  const handleEdit = (rec: any) => {
    setEditingId(rec.id);
    setFormData({
      title: rec.title,
      content: rec.content || '',
      type: rec.type
    });
    if (rec.image_url) {
      setImagePreview(rec.image_url);
    }
  };

  const handleDeleteClick = (id: number, title: string) => {
    setConfirmDelete({ isOpen: true, id, title });
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete.id) {
      try {
        await deleteRecommendation(confirmDelete.id);
        toast.success('Recomendación eliminada');
        loadRecommendations();
      } catch (error) {
        toast.error('Error al eliminar recomendación');
      } finally {
        setConfirmDelete({ isOpen: false, id: null, title: '' });
      }
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ isOpen: false, id: null, title: '' });
  };

  const handleReorder = async (dragIndex: number, dropIndex: number) => {
    const newOrder = [...recommendations];
    const [draggedItem] = newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    setRecommendations(newOrder);
    
    const ids = newOrder.map(item => item.id);
    try {
      await reorderRecommendations(ids);
      toast.success('Orden actualizado');
    } catch (error) {
      toast.error('Error al actualizar orden');
      loadRecommendations();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe exceder los 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTextWithLineBreaks = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-[#E6E3DE]">
          <div className="sticky top-0 bg-white border-b border-[#E6E3DE] px-6 py-4 bg-[#FAF9F7] flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#5A8C7A]">Recomendaciones Generales</h2>
            <button onClick={onClose} className="text-[#6E7C72] hover:text-[#2C3E34]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6">
            {/* Formulario para nueva recomendación */}
            <div className="bg-[#FAF9F7] rounded-lg p-4 mb-6 border border-[#E6E3DE]">
              <h3 className="text-md font-bold text-[#5A8C7A] mb-4">
                {editingId ? 'Editar Recomendación' : 'Nueva Recomendación'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Título *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A]"
                    placeholder="Ej: Recomendación para mejorar la digestión"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-2">Tipo</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="text"
                        checked={formData.type === 'text'}
                        onChange={() => setFormData({ ...formData, type: 'text', content: '' })}
                        className="text-[#5A8C7A]"
                      />
                      <span>Texto</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="image"
                        checked={formData.type === 'image'}
                        onChange={() => setFormData({ ...formData, type: 'image', content: '' })}
                        className="text-[#5A8C7A]"
                      />
                      <span>Imagen</span>
                    </label>
                  </div>
                </div>
                
                {formData.type === 'text' && (
                  <div>
                    <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Contenido *</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A]"
                      placeholder="Describe la recomendación..."
                    />
                  </div>
                )}
                
                {formData.type === 'image' && (
                  <div>
                    <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Imagen</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-32 w-32 object-cover rounded-lg border border-[#E6E3DE]"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-[#E6E3DE] rounded-lg text-[#6E7C72] hover:bg-[#FAF9F7]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Agregar')}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Lista de recomendaciones */}
            <div>
              <h3 className="text-md font-bold text-[#5A8C7A] mb-4">Lista de Recomendaciones</h3>
              {loading ? (
                <div className="text-center py-8 text-[#6E7C72]">Cargando...</div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-8 text-[#6E7C72]">No hay recomendaciones registradas</div>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div
                      key={rec.id}
                      className="border border-[#E6E3DE] rounded-lg p-4 bg-white"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-[#6E7C72]">#{rec.display_order}</span>
                            <h4 className="font-semibold text-[#2C3E34]">{rec.title}</h4>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${rec.type === 'text' ? 'bg-[#5A8C7A]/20' : 'bg-[#BD7D4A]/20'}`}>
                              {rec.type === 'text' ? 'Texto' : 'Imagen'}
                            </span>
                          </div>
                          {rec.type === 'text' && (
                            <p className="text-sm text-[#6E7C72] mt-2 whitespace-pre-wrap break-words">
                              {formatTextWithLineBreaks(rec.content)}
                            </p>
                          )}
                          {rec.type === 'image' && rec.image_url && (
                            <div className="mt-2">
                              <img
                                src={rec.image_url}
                                alt={rec.title}
                                className="h-40 w-auto object-cover rounded-lg border border-[#E6E3DE]"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(rec)}
                            className="text-[#5A8C7A] hover:text-[#4A7C6A]"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(rec.id, rec.title)}
                            className="text-[#F58634] hover:text-[#BD7D4A]"
                            title="Eliminar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <div className="flex flex-col gap-1">
                            {index > 0 && (
                              <button
                                onClick={() => handleReorder(index, index - 1)}
                                className="text-[#6E7C72] hover:text-[#5A8C7A]"
                                title="Subir"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                            )}
                            {index < recommendations.length - 1 && (
                              <button
                                onClick={() => handleReorder(index, index + 1)}
                                className="text-[#6E7C72] hover:text-[#5A8C7A]"
                                title="Bajar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación con Tailwind */}
      {confirmDelete.isOpen && (
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
                ¿Eliminar recomendación?
              </h3>
              <p className="text-sm text-[#6E7C72] text-center mb-6">
                ¿Estás seguro de que deseas eliminar la recomendación <strong className="text-[#2C3E34]">"{confirmDelete.title}"</strong>?<br />
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

// Importar la función getAllRecommendations
async function getAllRecommendations() {
  const { getAllRecommendations: fetchAll } = await import('@/lib/recommendations-actions');
  return fetchAll();
}