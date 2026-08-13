'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Producto, Categoria } from '@/lib/definitions';
import ProductCard from './ProductCard';
import { FaSearch, FaFilter } from 'react-icons/fa';

interface CatalogClientProps {
  productosIniciales: Producto[];
  categorias: Categoria[];
  queryInicial: string;
  categoriaSeleccionadaInicial: string;
  precioMinInicial?: number;
  precioMaxInicial?: number;
}

export default function CatalogClient({
  productosIniciales,
  categorias,
  queryInicial,
  categoriaSeleccionadaInicial,
  precioMinInicial,
  precioMaxInicial,
}: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(queryInicial);
  const [selectedCategory, setSelectedCategory] = useState(categoriaSeleccionadaInicial);
  const [priceMin, setPriceMin] = useState(precioMinInicial?.toString() || '');
  const [priceMax, setPriceMax] = useState(precioMaxInicial?.toString() || '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(queryInicial);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('query', debouncedSearch);
    if (selectedCategory && selectedCategory !== 'todos') params.set('categoria', selectedCategory);
    if (priceMin && parseFloat(priceMin) > 0) params.set('precioMin', priceMin);
    if (priceMax && parseFloat(priceMax) > 0) params.set('precioMax', priceMax);
    
    router.push(`/catalog?${params.toString()}`);
  }, [debouncedSearch, selectedCategory, priceMin, priceMax, router]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('todos');
    setPriceMin('');
    setPriceMax('');
    setDebouncedSearch('');
    router.push('/catalog');
  };

  const categoriasList = [{ id: 0, name: 'todos' }, ...categorias];

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar de filtros */}
          <div className="md:w-72 flex-shrink-0">
            <div className="bg-white rounded-lg border border-[#E6E3DE] p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E6E3DE]">
                <h2 className="text-base font-semibold text-[#2C3E34] flex items-center gap-2">
                  <FaFilter className="w-4 h-4 text-[#6B8E7B]" />
                  Filtros
                </h2>
                <button
                  onClick={clearFilters}
                  className="text-xs text-[#6E7C72] hover:text-[#F58634] transition-colors"
                >
                  Limpiar todo
                </button>
              </div>

              {/* Búsqueda */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-[#2C3E34] mb-2">Buscar producto</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nombre o descripción..."
                    className="w-full px-3 py-2 pl-9 border border-[#E6E3DE] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6B8E7B] text-sm"
                  />
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6E7C72]" />
                </div>
              </div>

              {/* Categorías */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-[#2C3E34] mb-2">Categoría</label>
                <div className="space-y-1.5">
                  {categoriasList.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${
                        selectedCategory === cat.name
                          ? 'bg-[#6B8E7B] text-white'
                          : 'text-[#2C3E34] hover:bg-[#FAF9F7]'
                      }`}
                    >
                      {cat.name === 'todos' ? 'Todos los productos' : cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rango de precios */}
              <div>
                <label className="block text-sm font-medium text-[#2C3E34] mb-2">Rango de precio</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      placeholder="Mínimo"
                      className="w-full px-2 py-1.5 border border-[#E6E3DE] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                    />
                  </div>
                  <span className="text-[#6E7C72] self-center">-</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      placeholder="Máximo"
                      className="w-full px-2 py-1.5 border border-[#E6E3DE] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#6B8E7B]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de productos */}
          <div className="flex-1">
            <div className="mb-5 pb-3 border-b border-[#E6E3DE]">
              <p className="text-sm text-[#6E7C72]">
                {productosIniciales.length} producto{productosIniciales.length !== 1 ? 's' : ''} encontrado{productosIniciales.length !== 1 ? 's' : ''}
              </p>
            </div>

            {productosIniciales.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E6E3DE] p-12 text-center">
                <p className="text-[#6E7C72] mb-3">No se encontraron productos</p>
                <button
                  onClick={clearFilters}
                  className="text-sm text-[#6B8E7B] hover:text-[#F58634] transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {productosIniciales.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}