'use server';

import postgres from 'postgres';
import cloudinary from './cloudinary';
import { revalidatePath } from 'next/cache';
import { registrarAuditoria, getCurrentUser } from './auditoria';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function crearProducto(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string);
    const categories = JSON.parse(formData.get('categories') as string) as number[];
    const imageFile = formData.get('image') as File;

    if (!name || !description || isNaN(price) || isNaN(stock) || categories.length === 0) {
      throw new Error('Todos los campos son requeridos');
    }

    let imageUrl = null;

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'productos',
            transformation: [{ width: 500, height: 500, crop: 'limit' }]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
      
      imageUrl = (result as any).secure_url;
    }

    // Obtener datos para auditoría
    const usuario = await getCurrentUser();
    const nuevosDatos = {
      name: name.trim(),
      description: description.trim(),
      price,
      stock,
      image_url: imageUrl,
      categories
    };

    // Insertar producto
    const [producto] = await sql`
      INSERT INTO tblproducts (
        name,
        description,
        price,
        stock,
        image_url,
        active
      ) VALUES (
        ${name.trim()},
        ${description.trim()},
        ${price},
        ${stock},
        ${imageUrl},
        true
      ) RETURNING id, name, description, price, stock, image_url
    `;

    // Insertar categorías
    if (categories.length > 0) {
      const categoriaInserts = categories.map(categoryId => sql`
        INSERT INTO tblproducts_categories (product_id, category_id)
        VALUES (${producto.id}, ${categoryId})
      `);
      await Promise.all(categoriaInserts);
    }

    // Registrar auditoría
    await registrarAuditoria({
      accion: 'INSERT',
      tabla_afectada: 'tblproducts',
      query_text: `INSERT INTO tblproducts (name, description, price, stock, image_url) VALUES (${name}, ${description}, ${price}, ${stock}, ${imageUrl})`,
      datos_nuevos: {
        ...nuevosDatos,
        id: producto.id
      }
    });

    revalidatePath('/admin/productos');
    return { success: true, message: 'Producto creado exitosamente' };
  } catch (error) {
    console.error('Error al crear producto:', error);
    throw new Error('No se pudo crear el producto');
  }
}

export async function actualizarProducto(formData: FormData) {
  try {
    const id = parseInt(formData.get('id') as string);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string);
    const categories = JSON.parse(formData.get('categories') as string) as number[];
    const imageFile = formData.get('image') as File;
    const existingImageUrl = formData.get('existing_image_url') as string;

    if (!name || !description || isNaN(price) || isNaN(stock) || categories.length === 0) {
      throw new Error('Todos los campos son requeridos');
    }

    // Obtener datos actuales del producto para auditoría
    const [productoActual] = await sql<any[]>`
      SELECT * FROM tblproducts WHERE id = ${id}
    `;

    if (!productoActual) {
      throw new Error('Producto no encontrado');
    }

    let imageUrl = existingImageUrl;

    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'productos',
            transformation: [{ width: 500, height: 500, crop: 'limit' }]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
      
      imageUrl = (result as any).secure_url;
    }

    // Actualizar producto
    await sql`
      UPDATE tblproducts
      SET 
        name = ${name.trim()},
        description = ${description.trim()},
        price = ${price},
        stock = ${stock},
        image_url = ${imageUrl},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    // Obtener categorías actuales
    const categoriasActuales = await sql<{ category_id: number }[]>`
      SELECT category_id FROM tblproducts_categories WHERE product_id = ${id}
    `;
    const categoriasActualesIds = categoriasActuales.map(c => c.category_id);

    // Eliminar categorías existentes
    await sql`
      DELETE FROM tblproducts_categories
      WHERE product_id = ${id}
    `;

    // Insertar nuevas categorías
    if (categories.length > 0) {
      const categoriaInserts = categories.map(categoryId => sql`
        INSERT INTO tblproducts_categories (product_id, category_id)
        VALUES (${id}, ${categoryId})
      `);
      await Promise.all(categoriaInserts);
    }

    // Registrar auditoría
    await registrarAuditoria({
      accion: 'UPDATE',
      tabla_afectada: 'tblproducts',
      query_text: `UPDATE tblproducts SET name='${name}', description='${description}', price=${price}, stock=${stock}, image_url='${imageUrl}' WHERE id=${id}`,
      datos_anteriores: {
        ...productoActual,
        categories: categoriasActualesIds
      },
      datos_nuevos: {
        id,
        name: name.trim(),
        description: description.trim(),
        price,
        stock,
        image_url: imageUrl,
        categories
      }
    });

    revalidatePath('/admin/productos');
    return { success: true, message: 'Producto actualizado exitosamente' };
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    throw new Error('No se pudo actualizar el producto');
  }
}

export async function eliminarProducto(id: number) {
  try {
    // Obtener datos actuales del producto para auditoría
    const [productoActual] = await sql<any[]>`
      SELECT * FROM tblproducts WHERE id = ${id}
    `;

    if (!productoActual) {
      throw new Error('Producto no encontrado');
    }

    // Obtener categorías actuales
    const categoriasActuales = await sql<{ category_id: number }[]>`
      SELECT category_id FROM tblproducts_categories WHERE product_id = ${id}
    `;
    const categoriasActualesIds = categoriasActuales.map(c => c.category_id);

    // Realizar eliminación lógica
    await sql`
      UPDATE tblproducts
      SET active = false, updated_at = NOW()
      WHERE id = ${id}
    `;

    // Registrar auditoría
    await registrarAuditoria({
      accion: 'DELETE',
      tabla_afectada: 'tblproducts',
      query_text: `UPDATE tblproducts SET active=false WHERE id=${id}`,
      datos_anteriores: {
        ...productoActual,
        categories: categoriasActualesIds
      }
    });

    revalidatePath('/admin/productos');
    return { success: true, message: 'Producto eliminado exitosamente' };
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    throw new Error('No se pudo eliminar el producto');
  }
}