'use server';

import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import cloudinary from './cloudinary';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Obtener todas las recomendaciones activas ordenadas
export async function getRecommendations() {
  try {
    const recommendations = await sql`
      SELECT * FROM tblgeneral_recommendations
      WHERE is_active = true
      ORDER BY display_order ASC
    `;
    
    return recommendations;
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error);
    throw new Error('No se pudieron obtener las recomendaciones');
  }
}

// Obtener todas las recomendaciones (incluyendo inactivas) para admin
export async function getAllRecommendations() {
  try {
    const recommendations = await sql`
      SELECT * FROM tblgeneral_recommendations
      ORDER BY display_order ASC
    `;
    
    return recommendations;
  } catch (error) {
    console.error('Error al obtener todas las recomendaciones:', error);
    throw new Error('No se pudieron obtener las recomendaciones');
  }
}

// Crear una nueva recomendación
export async function createRecommendation(data: {
  title: string;
  content?: string;
  image_url?: string;
  type: 'text' | 'image';
}) {
  try {
    // Obtener el último orden
    const [lastOrder] = await sql`
      SELECT MAX(display_order) as max_order FROM tblgeneral_recommendations
    `;
    const newOrder = (lastOrder?.max_order || 0) + 1;

    const [recommendation] = await sql`
      INSERT INTO tblgeneral_recommendations (
        title, content, image_url, type, display_order, is_active
      ) VALUES (
        ${data.title}, ${data.content || null}, ${data.image_url || null},
        ${data.type}, ${newOrder}, true
      )
      RETURNING *
    `;
    
    revalidatePath('/admin/recommendations');
    return { success: true, recommendation };
  } catch (error) {
    console.error('Error al crear recomendación:', error);
    throw new Error('No se pudo crear la recomendación');
  }
}

// Actualizar una recomendación
export async function updateRecommendation(id: number, data: {
  title?: string;
  content?: string;
  image_url?: string;
  type?: 'text' | 'image';
  is_active?: boolean;
}) {
  try {
    const updates = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(data.content);
    }
    if (data.image_url !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(data.image_url);
    }
    if (data.type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      values.push(data.type);
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(id);
    
    if (updates.length > 1) {
      const query = `
        UPDATE tblgeneral_recommendations
        SET ${updates.join(', ')}
        WHERE id = $${values.length}
      `;
      await sql.unsafe(query, values);
    }
    
    revalidatePath('/admin/recommendations');
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar recomendación:', error);
    throw new Error('No se pudo actualizar la recomendación');
  }
}

// Eliminar una recomendación
export async function deleteRecommendation(id: number) {
  try {
    await sql`
      DELETE FROM tblgeneral_recommendations
      WHERE id = ${id}
    `;
    
    revalidatePath('/admin/recommendations');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar recomendación:', error);
    throw new Error('No se pudo eliminar la recomendación');
  }
}

// Reordenar recomendaciones
export async function reorderRecommendations(ids: number[]) {
  try {
    for (let i = 0; i < ids.length; i++) {
      await sql`
        UPDATE tblgeneral_recommendations
        SET display_order = ${i + 1}, updated_at = NOW()
        WHERE id = ${ids[i]}
      `;
    }
    
    revalidatePath('/admin/recommendations');
    return { success: true };
  } catch (error) {
    console.error('Error al reordenar recomendaciones:', error);
    throw new Error('No se pudo reordenar las recomendaciones');
  }
}

// Subir imagen a Cloudinary
export async function uploadRecommendationImage(formData: FormData) {
  try {
    const imageFile = formData.get('image') as File;
    
    if (!imageFile || imageFile.size === 0) {
      throw new Error('No se seleccionó ninguna imagen');
    }
    
    // Validar tamaño máximo de 5 MB (5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (imageFile.size > maxSize) {
      throw new Error('La imagen no debe exceder los 5 MB');
    }
    
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      throw new Error('Formato de imagen no válido. Use JPG, PNG, GIF o WEBP');
    }
    
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'recommendations',
          transformation: [
            { width: 800, height: 600, crop: 'limit', quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });
    
    return { success: true, url: (result as any).secure_url };
  } catch (error) {
    console.error('Error al subir imagen:', error);
    throw new Error(error instanceof Error ? error.message : 'No se pudo subir la imagen');
  }
}