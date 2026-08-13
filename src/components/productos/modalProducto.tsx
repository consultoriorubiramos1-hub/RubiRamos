'use client';

import { useState, useEffect } from 'react';
import { Producto, Categoria } from '@/lib/definitions';
import { crearProducto, actualizarProducto } from '@/lib/productos-actions';
import { getCategoriasByProducto, verificarNombreProducto } from '@/lib/productos-data';
import { toast } from 'react-hot-toast';

interface ModalProductoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  producto: Producto | null;
  categorias: Categoria[];
}

export default function ModalProducto({
  isOpen,
  onClose,
  onSuccess,
  producto,
  categorias,
}: ModalProductoProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<number[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  
  // Estados para validación del nombre
  const [nombreExiste, setNombreExiste] = useState(false);
  const [verificandoNombre, setVerificandoNombre] = useState(false);
  const [nombreOriginal, setNombreOriginal] = useState('');

  // Debounce para verificar nombre
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setTimeout(async () => {
      const nombreActual = formData.name.trim();
      
      // No verificar si está vacío
      if (!nombreActual) {
        setNombreExiste(false);
        return;
      }
      
      // Para edición: si el nombre es igual al original, no verificar
      if (producto && nombreActual === nombreOriginal) {
        setNombreExiste(false);
        return;
      }
      
      setVerificandoNombre(true);
      try {
        const existe = await verificarNombreProducto(nombreActual, producto?.id);
        setNombreExiste(existe);
      } catch (error) {
        console.error('Error al verificar nombre:', error);
        setNombreExiste(false);
      } finally {
        setVerificandoNombre(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [formData.name, producto, isOpen, nombreOriginal]);

  useEffect(() => {
    if (producto) {
      setFormData({
        name: producto.name,
        description: producto.description,
        price: producto.price.toString(),
        stock: producto.stock.toString(),
      });
      setNombreOriginal(producto.name);
      setImagePreview(producto.image_url || '');
      
      setCargandoCategorias(true);
      getCategoriasByProducto(producto.id)
        .then(setCategoriasSeleccionadas)
        .catch(error => {
          console.error('Error al cargar categorías:', error);
          toast.error('Error al cargar categorías del producto');
        })
        .finally(() => setCargandoCategorias(false));
    } else {
      resetForm();
    }
  }, [producto]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
    });
    setNombreOriginal('');
    setNombreExiste(false);
    setImageFile(null);
    setImagePreview('');
    setCategoriasSeleccionadas([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que el nombre no exista
    if (nombreExiste) {
      toast.error('Ya existe un producto con este nombre');
      return;
    }
    
    setLoading(true);

    try {
      if (categoriasSeleccionadas.length === 0) {
        toast.error('Debes seleccionar al menos una categoría');
        setLoading(false);
        return;
      }

      const submitFormData = new FormData();
      submitFormData.append('name', formData.name);
      submitFormData.append('description', formData.description);
      submitFormData.append('price', formData.price);
      submitFormData.append('stock', formData.stock);
      submitFormData.append('categories', JSON.stringify(categoriasSeleccionadas));
      
      if (imageFile) {
        submitFormData.append('image', imageFile);
      }
      
      if (producto) {
        submitFormData.append('id', producto.id.toString());
        submitFormData.append('existing_image_url', producto.image_url || '');
        await actualizarProducto(submitFormData);
        toast.success('Producto actualizado exitosamente');
      } else {
        await crearProducto(submitFormData);
        toast.success('Producto creado exitosamente');
      }
      
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar producto');
    } finally {
      setLoading(false);
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

  const toggleCategoria = (categoriaId: number) => {
    setCategoriasSeleccionadas(prev =>
      prev.includes(categoriaId)
        ? prev.filter(id => id !== categoriaId)
        : [...prev, categoriaId]
    );
  };

  // Determinar si el botón de guardar debe estar deshabilitado
  const isSubmitDisabled = () => {
    if (loading) return true;
    if (categoriasSeleccionadas.length === 0) return true;
    if (cargandoCategorias) return true;
    if (!formData.name.trim()) return true;
    if (!formData.description.trim()) return true;
    if (!formData.price || parseFloat(formData.price) <= 0) return true;
    if (!formData.stock || parseInt(formData.stock) < 0) return true;
    if (nombreExiste) return true;
    if (verificandoNombre) return true;
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E6E3DE]">
        <div className="sticky top-0 bg-white border-b border-[#E6E3DE] px-6 py-4 bg-[#FAF9F7]">
          <h2 className="text-xl font-bold text-[#6B8E7B]">
            {producto ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#6E7C72] hover:text-[#2C3E34] transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre con validación en tiempo real */}
          <div>
            <label className="block text-sm font-semibold text-[#2C3E34] mb-2">
              Nombre del Producto *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent transition-all text-[#2C3E34] ${
                  nombreExiste && formData.name.trim()
                    ? 'border-[#F58634] bg-[#F58634]/5'
                    : 'border-[#E6E3DE]'
                }`}
                placeholder="Ej: Proteína Whey Vainilla"
              />
              {verificandoNombre && (
                <div className="absolute right-3 top-2.5">
                  <svg className="animate-spin h-5 w-5 text-[#6B8E7B]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              {nombreExiste && formData.name.trim() && !verificandoNombre && (
                <p className="mt-1 text-sm text-[#F58634]">
                  ⚠️ Ya existe un producto con este nombre
                </p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-[#2C3E34] mb-2">
              Descripción *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent transition-all text-[#2C3E34]"
              placeholder="Describe el producto, sus beneficios y características..."
            />
          </div>

          {/* Precio y Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#2C3E34] mb-2">
                Precio (MXN) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent transition-all text-[#2C3E34]"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2C3E34] mb-2">
                Stock *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent transition-all text-[#2C3E34]"
                placeholder="0"
              />
            </div>
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-sm font-semibold text-[#2C3E34] mb-2">
              Imagen del Producto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E7B] focus:border-transparent transition-all text-[#2C3E34] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#6B8E7B] file:text-white hover:file:bg-[#4A7C6A]"
            />
            {imagePreview && (
              <div className="mt-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-lg border border-[#E6E3DE]"
                />
              </div>
            )}
            <p className="mt-1 text-xs text-[#6E7C72]">
              Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
            </p>
          </div>

          {/* Categorías */}
          <div>
            <label className="block text-sm font-semibold text-[#2C3E34] mb-2">
              Categorías * ({categoriasSeleccionadas.length} seleccionadas)
            </label>
            {cargandoCategorias ? (
              <div className="text-center py-4 text-[#6E7C72]">Cargando categorías...</div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-[#E6E3DE] rounded-lg p-3 bg-[#FAF9F7]">
                {categorias.map((categoria) => (
                  <label key={categoria.id} className="flex items-center space-x-2 hover:bg-white p-2 rounded-lg transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoriasSeleccionadas.includes(categoria.id)}
                      onChange={() => toggleCategoria(categoria.id)}
                      className="rounded border-[#E6E3DE] text-[#6B8E7B] focus:ring-[#6B8E7B]"
                    />
                    <span className="text-sm text-[#2C3E34]">{categoria.name}</span>
                  </label>
                ))}
              </div>
            )}
            {categoriasSeleccionadas.length === 0 && !cargandoCategorias && (
              <p className="mt-1 text-sm text-[#F58634]">
                Selecciona al menos una categoría
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-[#E6E3DE]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E6E3DE] rounded-lg text-[#6E7C72] hover:bg-[#FAF9F7] transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled()}
              className="px-4 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                producto ? 'Actualizar' : 'Crear'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}