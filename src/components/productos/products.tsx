'use client';

import { useState, useEffect, useCallback } from 'react';
import { Producto, Categoria } from '@/lib/definitions';
import { eliminarProducto } from '@/lib/productos-actions';
import ModalProducto from './modalProducto';
import { toast } from 'react-hot-toast';

interface ProductosClientProps {
  productosIniciales: Producto[];
  categorias: Categoria[];
  totalInicial: number;
}

// Función helper para formatear precio de manera segura
const formatPrice = (price: number): string => {
  if (typeof price !== 'number' || isNaN(price)) {
    return '$0.00';
  }
  return `$${price.toFixed(2)}`;
};

// Función para obtener el estado del stock con colores de la paleta
const getStockStatus = (stock: number): string => {
  if (stock > 10) return 'bg-[#A8CF45]/20 text-[#2C3E34]';
  if (stock > 0) return 'bg-[#BD7D4A]/20 text-[#2C3E34]';
  return 'bg-[#F58634]/20 text-[#2C3E34]';
};

type SortField = 'name' | 'price' | 'stock';
type SortOrder = 'asc' | 'desc';

export default function ProductosClient({ 
  productosIniciales, 
  categorias, 
  totalInicial 
}: ProductosClientProps) {
  const [productos, setProductos] = useState<Producto[]>(productosIniciales);
  const [total, setTotal] = useState(totalInicial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; productId: number | null; productName: string }>({
    isOpen: false,
    productId: null,
    productName: ''
  });
  
  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number>(0);
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina] = useState(10);
  
  // Estados para ordenamiento
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Debounce para búsqueda
  const [searchDebounced, setSearchDebounced] = useState('');

  // Efecto para debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Efecto para resetear página cuando cambian filtros u ordenamiento
  useEffect(() => {
    setPaginaActual(1);
  }, [searchDebounced, categoriaSeleccionada, sortField, sortOrder]);

  // Cargar productos con filtros y ordenamiento
  const cargarProductos = useCallback(async () => {
    setCargando(true);
    try {
      const { getProductos } = await import('@/lib/productos-data');
      const result = await getProductos({
        search: searchDebounced,
        categoriaId: categoriaSeleccionada === 0 ? undefined : categoriaSeleccionada,
        page: paginaActual,
        pageSize: itemsPorPagina,
        sortBy: sortField,
        sortOrder: sortOrder
      });
      setProductos(result.productos);
      setTotal(result.total);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar productos');
    } finally {
      setCargando(false);
    }
  }, [searchDebounced, categoriaSeleccionada, paginaActual, itemsPorPagina, sortField, sortOrder]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const handleDeleteClick = (id: number, name: string) => {
    setDeleteConfirm({
      isOpen: true,
      productId: id,
      productName: name
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirm.productId) {
      setEliminandoId(deleteConfirm.productId);
      try {
        await eliminarProducto(deleteConfirm.productId);
        toast.success('Producto eliminado exitosamente');
        cargarProductos();
      } catch (error) {
        toast.error('Error al eliminar producto');
      } finally {
        setEliminandoId(null);
        setDeleteConfirm({ isOpen: false, productId: null, productName: '' });
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, productId: null, productName: '' });
  };

  const handleEditar = (producto: Producto) => {
    setEditingProducto(producto);
    setModalOpen(true);
  };

  const handleCrear = () => {
    setEditingProducto(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingProducto(null);
  };

  const handleProductoGuardado = async () => {
    cargarProductos();
    handleModalClose();
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setCategoriaSeleccionada(0);
    setSortField('name');
    setSortOrder('asc');
    setPaginaActual(1);
  };

  // Función para manejar el ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Obtener el ícono de ordenamiento
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 inline-block ml-1 text-[#6E7C72]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 inline-block ml-1 text-[#6B8E7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 inline-block ml-1 text-[#6B8E7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const totalPaginas = Math.ceil(total / itemsPorPagina);

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#5A8C7A]">Productos</h1>
          <button
            onClick={handleCrear}
            disabled={cargando}
            className="bg-[#BD7D4A] hover:bg-[#F58634] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            + Nuevo Producto
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-[#E6E3DE]">
          <div className="flex gap-4 items-end">
            {/* Búsqueda por nombre/descripción */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-[#2C3E34] mb-2">
                Buscar producto
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o descripción..."
                  className="w-full pl-10 pr-4 py-2 border border-[#E6E3DE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent transition-all text-[#2C3E34]"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-[#6E7C72]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Filtro por categoría */}
            <div className="w-64">
              <label className="block text-sm font-semibold text-[#2C3E34] mb-2">
                Filtrar por categoría
              </label>
              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(Number(e.target.value))}
                className="w-full px-4 py-2 border border-[#E6E3DE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent transition-all text-[#2C3E34] bg-white"
              >
                <option value={0}>Todas las categorías</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón limpiar filtros - X roja */}
            <button
              onClick={limpiarFiltros}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              title="Limpiar filtros"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Resultados encontrados */}
          <div className="mt-3 text-sm text-[#6E7C72]">
            {cargando ? (
              <span>Cargando...</span>
            ) : (
              <span>Se encontraron {total} producto{total !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Tabla de productos */}
        {cargando && productos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-[#E6E3DE]">
            <p className="text-[#6E7C72]">Cargando productos...</p>
          </div>
        ) : productos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-[#E6E3DE]">
            <p className="text-[#6E7C72]">No hay productos registrados</p>
            <button
              onClick={handleCrear}
              className="mt-4 text-[#BD7D4A] hover:text-[#F58634] transition-colors font-semibold"
            >
              Crear el primer producto
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#E6E3DE]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E6E3DE]">
                  <thead className="bg-[#FAF9F7]">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider cursor-pointer hover:text-[#5A8C7A] transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <span className="flex items-center">
                          Producto
                          {getSortIcon('name')}
                        </span>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider cursor-pointer hover:text-[#5A8C7A] transition-colors"
                        onClick={() => handleSort('price')}
                      >
                        <span className="flex items-center">
                          Precio
                          {getSortIcon('price')}
                        </span>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider cursor-pointer hover:text-[#5A8C7A] transition-colors"
                        onClick={() => handleSort('stock')}
                      >
                        <span className="flex items-center">
                          Stock
                          {getSortIcon('stock')}
                        </span>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#E6E3DE]">
                    {productos.map((producto) => (
                      <tr key={producto.id} className="hover:bg-[#FAF9F7] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {producto.image_url && (
                              <img
                                src={producto.image_url}
                                alt={producto.name}
                                className="h-10 w-10 rounded-lg object-cover mr-3 border border-[#E6E3DE]"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-[#2C3E34]">
                                {producto.name}
                              </div>
                              <div className="text-sm text-[#6E7C72]">
                                {producto.description.substring(0, 50)}
                                {producto.description.length > 50 ? '...' : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-[#2C3E34]">
                            {formatPrice(producto.price)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getStockStatus(producto.stock)}`}>
                            {producto.stock} unidades
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditar(producto)}
                            disabled={cargando}
                            className="text-[#BD7D4A] hover:text-[#F58634] transition-colors"
                            title="Editar"
                          >
                            <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(producto.id, producto.name)}
                            disabled={eliminandoId === producto.id || cargando}
                            className="text-[#F58634] hover:text-[#BD7D4A] transition-colors disabled:opacity-50"
                            title="Eliminar"
                          >
                            <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-[#6E7C72]">
                  Mostrando {((paginaActual - 1) * itemsPorPagina) + 1} - {Math.min(paginaActual * itemsPorPagina, total)} de {total} productos
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                    disabled={paginaActual === 1 || cargando}
                    className="px-3 py-1 border border-[#E6E3DE] rounded-lg text-[#2C3E34] hover:bg-[#FAF9F7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                      let pageNum;
                      if (totalPaginas <= 5) {
                        pageNum = i + 1;
                      } else if (paginaActual <= 3) {
                        pageNum = i + 1;
                      } else if (paginaActual >= totalPaginas - 2) {
                        pageNum = totalPaginas - 4 + i;
                      } else {
                        pageNum = paginaActual - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPaginaActual(pageNum)}
                          className={`px-3 py-1 rounded-lg transition-colors ${
                            paginaActual === pageNum
                              ? 'bg-[#5A8C7A] text-white'
                              : 'border border-[#E6E3DE] text-[#2C3E34] hover:bg-[#FAF9F7]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas || cargando}
                    className="px-3 py-1 border border-[#E6E3DE] rounded-lg text-[#2C3E34] hover:bg-[#FAF9F7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <ModalProducto
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleProductoGuardado}
          producto={editingProducto}
          categorias={categorias}
        />
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
                ¿Eliminar producto?
              </h3>
              <p className="text-sm text-[#6E7C72] text-center mb-6">
                ¿Estás seguro de que deseas eliminar el producto <strong className="text-[#2C3E34]">"{deleteConfirm.productName}"</strong>?<br />
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