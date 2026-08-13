import { fetchCategorias, fetchProductos } from '@/lib/data';
import CatalogClient from '@/components/catalog/CatalogClient';

export const metadata = {
  title: 'Catálogo de Suplementos - Consultorio Nutricional',
  description: 'Productos nutricionales de calidad premium para complementar tu plan alimenticio',
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; categoria?: string; precioMin?: string; precioMax?: string }>
}) {
  const params = await searchParams;
  const query = params?.query || '';
  const categoriaParam = params?.categoria || '';
  const precioMin = params?.precioMin ? parseFloat(params.precioMin) : undefined;
  const precioMax = params?.precioMax ? parseFloat(params.precioMax) : undefined;
  
  const categorias = await fetchCategorias();
  
  let categoriaId: number | undefined;
  if (categoriaParam && categoriaParam !== 'todos') {
    const categoriaEncontrada = categorias.find(c => c.name === categoriaParam);
    categoriaId = categoriaEncontrada?.id;
  }
  
  const productos = await fetchProductos({
    categoriaId,
    precioMin,
    precioMax,
    search: query
  });

  return (
    <CatalogClient 
      productosIniciales={productos}
      categorias={categorias}
      queryInicial={query}
      categoriaSeleccionadaInicial={categoriaParam || 'todos'}
      precioMinInicial={precioMin}
      precioMaxInicial={precioMax}
    />
  );
}