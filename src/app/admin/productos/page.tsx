import { Suspense } from 'react';
import { getProductos, getCategoriasActivas } from '@/lib/productos-data';
import ProductosClient from '@/components/productos/products';

export const dynamic = 'force-dynamic';

export default async function ProductosPage() {
  // Cargar datos iniciales sin filtros
  const [productosResult, categorias] = await Promise.all([
    getProductos({ page: 1, pageSize: 10 }),
    getCategoriasActivas()
  ]);

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <Suspense fallback={<div className="p-6 text-center text-[#6E7C72]">Cargando productos...</div>}>
        <ProductosClient 
          productosIniciales={productosResult.productos}
          categorias={categorias}
          totalInicial={productosResult.total}
        />
      </Suspense>
    </div>
  );
}