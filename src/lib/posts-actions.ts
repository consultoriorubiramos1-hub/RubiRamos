'use server';

import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import cloudinary from './cloudinary';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Obtener todas las publicaciones activas
export async function getPosts(search?: string, userId?: number) {
  try {
    let query = `
      SELECT p.*, u.username, u.email,
             (SELECT COUNT(*) FROM tblpost_likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM tblpost_likes WHERE post_id = p.id AND user_id = ${userId || 0}) as user_has_liked
      FROM tblposts p
      JOIN tblusers u ON p.created_by = u.id
      WHERE p.is_active = true
    `;
    const params: any[] = [];
    
    if (search && search.trim()) {
      query += ` AND (p.title ILIKE $1 OR p.description ILIKE $1 OR p.content ILIKE $1)`;
      params.push(`%${search.trim()}%`);
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    const posts = await sql.unsafe(query, params);
    
    // Obtener imágenes y enlaces para cada post
    const postsWithMedia = await Promise.all(
      posts.map(async (post) => {
        const images = await sql`
          SELECT * FROM tblpost_images
          WHERE post_id = ${post.id}
          ORDER BY display_order ASC
        `;
        
        const links = await sql`
          SELECT * FROM tblpost_links
          WHERE post_id = ${post.id}
          ORDER BY display_order ASC
        `;
        
        return {
          ...post,
          images: images.map(img => ({ id: img.id, url: img.image_url, order: img.display_order })),
          links: links.map(link => ({ id: link.id, url: link.link_url, title: link.link_title, order: link.display_order })),
          user_has_liked: Number(post.user_has_liked) > 0,
          likes_count: Number(post.likes_count)
        };
      })
    );
    
    return postsWithMedia;
  } catch (error) {
    console.error('Error al obtener publicaciones:', error);
    throw new Error('No se pudieron obtener las publicaciones');
  }
}

// Subir múltiples imágenes a Cloudinary
export async function uploadPostImages(formData: FormData) {
  try {
    const files = formData.getAll('images') as File[];
    const urls: string[] = [];
    
    for (const file of files) {
      if (file.size === 0) continue;
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`La imagen ${file.name} excede los 5MB`);
      }
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'posts',
            transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
      
      urls.push((result as any).secure_url);
    }
    
    return { success: true, urls };
  } catch (error) {
    console.error('Error al subir imágenes:', error);
    throw new Error('No se pudieron subir las imágenes');
  }
}

// Crear una nueva publicación
export async function createPost(data: {
  title?: string;
  description?: string;
  content?: string;
  created_by: number;
  image_urls?: string[];
  links?: { url: string; title?: string }[];
}) {
  try {
    const [post] = await sql`
      INSERT INTO tblposts (title, description, content, created_by)
      VALUES (${data.title || null}, ${data.description || null}, ${data.content || null}, ${data.created_by})
      RETURNING id
    `;
    
    if (data.image_urls && data.image_urls.length > 0) {
      for (let i = 0; i < data.image_urls.length; i++) {
        await sql`
          INSERT INTO tblpost_images (post_id, image_url, display_order)
          VALUES (${post.id}, ${data.image_urls[i]}, ${i})
        `;
      }
    }
    
    if (data.links && data.links.length > 0) {
      for (let i = 0; i < data.links.length; i++) {
        await sql`
          INSERT INTO tblpost_links (post_id, link_url, link_title, display_order)
          VALUES (${post.id}, ${data.links[i].url}, ${data.links[i].title || null}, ${i})
        `;
      }
    }
    
    revalidatePath('/admin/muro');
    return { success: true, post_id: post.id };
  } catch (error) {
    console.error('Error al crear publicación:', error);
    throw new Error('No se pudo crear la publicación');
  }
}

// Actualizar una publicación
export async function updatePost(id: number, data: {
  title?: string;
  description?: string;
  content?: string;
  image_urls?: string[];
  links?: { url: string; title?: string }[];
}) {
  try {
    await sql`
      UPDATE tblposts
      SET 
        title = ${data.title || null},
        description = ${data.description || null},
        content = ${data.content || null},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    
    if (data.image_urls !== undefined) {
      await sql`DELETE FROM tblpost_images WHERE post_id = ${id}`;
      if (data.image_urls.length > 0) {
        for (let i = 0; i < data.image_urls.length; i++) {
          await sql`
            INSERT INTO tblpost_images (post_id, image_url, display_order)
            VALUES (${id}, ${data.image_urls[i]}, ${i})
          `;
        }
      }
    }
    
    if (data.links !== undefined) {
      await sql`DELETE FROM tblpost_links WHERE post_id = ${id}`;
      if (data.links.length > 0) {
        for (let i = 0; i < data.links.length; i++) {
          await sql`
            INSERT INTO tblpost_links (post_id, link_url, link_title, display_order)
            VALUES (${id}, ${data.links[i].url}, ${data.links[i].title || null}, ${i})
          `;
        }
      }
    }
    
    revalidatePath('/admin/muro');
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar publicación:', error);
    throw new Error('No se pudo actualizar la publicación');
  }
}

// Eliminar una publicación
export async function deletePost(id: number) {
  try {
    await sql`
      UPDATE tblposts
      SET is_active = false, updated_at = NOW()
      WHERE id = ${id}
    `;
    
    revalidatePath('/admin/muro');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar publicación:', error);
    throw new Error('No se pudo eliminar la publicación');
  }
}

// Dar/quitar like a una publicación
export async function toggleLikePost(postId: number, userId: number) {
  try {
    const [existing] = await sql`
      SELECT id FROM tblpost_likes
      WHERE post_id = ${postId} AND user_id = ${userId}
    `;
    
    if (existing) {
      await sql`
        DELETE FROM tblpost_likes
        WHERE post_id = ${postId} AND user_id = ${userId}
      `;
    } else {
      await sql`
        INSERT INTO tblpost_likes (post_id, user_id)
        VALUES (${postId}, ${userId})
      `;
    }
    
    revalidatePath('/admin/muro');
    return { success: true };
  } catch (error) {
    console.error('Error al procesar like:', error);
    throw new Error('No se pudo procesar el like');
  }
}