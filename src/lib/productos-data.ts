'use server';

import postgres from 'postgres';
import { Categoria, Producto } from './definitions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Helper para convertir producto de la DB a tipo Producto
const convertToProducto = (dbProduct: any): Producto => ({
  id: Number(dbProduct.id),
  name: dbProduct.name,
  description: dbProduct.description,
  price: typeof dbProduct.price === 'string' ? parseFloat(dbProduct.price) : Number(dbProduct.price),
  stock: typeof dbProduct.stock === 'string' ? parseInt(dbProduct.stock) : Number(dbProduct.stock),
  image_url: dbProduct.image_url,
  created_at: new Date(dbProduct.created_at),
  updated_at: new Date(dbProduct.updated_at),
  active: dbProduct.active
});

export async function getProductos(params?: { 
  search?: string;
  categoriaId?: number;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'price' | 'stock';
  sortOrder?: 'asc' | 'desc';
}): Promise<{ productos: Producto[]; total: number }> {
  try {
    const { 
      search, 
      categoriaId, 
      page = 1, 
      pageSize = 10,
      sortBy = 'name',
      sortOrder = 'asc'
    } = params || {};
    const offset = (page - 1) * pageSize;
    
    let whereConditions = [];
    let queryParams: any[] = [];
    let paramIndex = 1;
    
    // Condición de búsqueda por nombre o descripción
    if (search && search.trim()) {
      whereConditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search.trim()}%`);
      paramIndex++;
    }
    
    // Condición de categoría
    if (categoriaId && categoriaId > 0) {
      whereConditions.push(`pc.category_id = $${paramIndex}`);
      queryParams.push(categoriaId);
      paramIndex++;
    }
    
    // Siempre mostrar solo productos activos
    whereConditions.push(`p.active = true`);
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // Mapeo de columnas para ordenamiento
    const sortColumnMap = {
      name: 'p.name',
      price: 'p.price',
      stock: 'p.stock'
    };
    const sortColumn = sortColumnMap[sortBy] || 'p.name';
    const sortDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';
    
    // Contar total de registros
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM tblproducts p
      LEFT JOIN tblproducts_categories pc ON pc.product_id = p.id
      ${whereClause}
    `;
    
    const totalResult = await sql.unsafe(countQuery, queryParams);
    const total = Number(totalResult[0].total);
    
    // Obtener productos paginados con ordenamiento
    let dataQuery = `
      SELECT DISTINCT p.*
      FROM tblproducts p
      LEFT JOIN tblproducts_categories pc ON pc.product_id = p.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;
    
    const productos = await sql.unsafe(dataQuery, queryParams);
    
    return {
      productos: productos.map(convertToProducto),
      total
    };
  } catch (error) {
    console.error('Error en getProductos:', error);
    throw new Error('No se pudieron obtener los productos');
  }
}

export async function getCategoriasActivas(): Promise<Categoria[]> {
  try {
    const categorias = await sql<any[]>`
      SELECT * FROM tblcategories 
      WHERE active = true 
      ORDER BY name ASC
    `;
    
    return categorias.map(categoria => ({
      id: Number(categoria.id),
      name: categoria.name,
      description: categoria.description,
      created_at: new Date(categoria.created_at),
      updated_at: new Date(categoria.updated_at),
      active: categoria.active
    }));
  } catch (error) {
    console.error('Error al obtener categorías activas:', error);
    throw new Error('No se pudieron obtener las categorías');
  }
}

export async function getCategoriasByProducto(productoId: number): Promise<number[]> {
  try {
    const result = await sql<{ category_id: number | string }[]>`
      SELECT category_id 
      FROM tblproducts_categories 
      WHERE product_id = ${productoId}
    `;
    
    return result.map(row => Number(row.category_id));
  } catch (error) {
    console.error('Error al obtener categorías del producto:', error);
    throw new Error('No se pudieron obtener las categorías del producto');
  }
}

export async function verificarNombreProducto(nombre: string, idExcluir?: number): Promise<boolean> {
  try {
    let query = `
      SELECT COUNT(*) as count
      FROM tblproducts 
      WHERE name ILIKE $1 AND active = true
    `;
    let params = [nombre.trim()];
    
    if (idExcluir) {
      query += ` AND id != $2`;
      params.push(idExcluir.toString());
    }
    
    const result = await sql.unsafe(query, params);
    return Number(result[0].count) > 0;
  } catch (error) {
    console.error('Error al verificar nombre de producto:', error);
    return false;
  }
}