import postgres from 'postgres';
import {
    Categoria,
    Producto,
} from './definitions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function fetchCategorias(): Promise<Categoria[]> {
  try {
    return await sql<Categoria[]>`SELECT * FROM tblcategories WHERE active IS true ORDER BY name ASC`;
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    throw new Error('No se pudieron obtener las categorías');
  }
}

export async function fetchProductos(params?: { 
  categoriaId?: number;
  precioMin?: number;
  precioMax?: number;
  search?: string;
}): Promise<Producto[]> {
  try {
    const { categoriaId, precioMin, precioMax, search } = params || {};
    
    let queryConditions = [];
    let queryParams: any[] = [];
    let paramIndex = 1;
    
    // Condición de categoría
    if (categoriaId) {
      queryConditions.push(`EXISTS (
        SELECT 1 FROM tblproducts_categories pc 
        WHERE pc.product_id = p.id AND pc.category_id = $${paramIndex}
      )`);
      queryParams.push(categoriaId);
      paramIndex++;
    }
    
    // Condición de precio mínimo
    if (precioMin !== undefined && !isNaN(precioMin)) {
      queryConditions.push(`p.price >= $${paramIndex}`);
      queryParams.push(precioMin);
      paramIndex++;
    }
    
    // Condición de precio máximo
    if (precioMax !== undefined && !isNaN(precioMax)) {
      queryConditions.push(`p.price <= $${paramIndex}`);
      queryParams.push(precioMax);
      paramIndex++;
    }
    
    // Condición de búsqueda
    if (search && search.trim()) {
      queryConditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }
    
    // Siempre activos
    queryConditions.push(`p.active = true`);
    
    const whereClause = queryConditions.length > 0 
      ? `WHERE ${queryConditions.join(' AND ')}` 
      : '';
    
    const query = `
      SELECT DISTINCT p.*
      FROM tblproducts p
      ${whereClause}
      ORDER BY p.name ASC
    `;
    
    const result = await sql.unsafe(query, queryParams);
    return result as unknown as Producto[];
  } catch (error) {
    console.error('Error en fetchProductos:', error);
    throw new Error('No se pudieron obtener los productos');
  }
}

export async function fetchProductosByCategoria(categoriaId: number, search?: string): Promise<Producto[]> {
  return fetchProductos({ categoriaId, search });
}