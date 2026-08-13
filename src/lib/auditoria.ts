'use server';

import postgres from 'postgres';
import { getServerSession } from 'next-auth';
import { authConfig } from './auth.config';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

interface AuditoriaData {
  accion: 'INSERT' | 'UPDATE' | 'DELETE';
  tabla_afectada: string;
  query_text?: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
}

export async function registrarAuditoria(data: AuditoriaData) {
  try {
    // Obtener la sesión del usuario actual usando tu authConfig
    const session = await getServerSession(authConfig);
    
    // Obtener el nombre de usuario de la sesión
    let usuario = 'usuario_desconocido';
    if (session?.user) {
      if (session.user.username) {
        usuario = session.user.username;
      } else if (session.user.email) {
        usuario = session.user.email;
      }
    }
    
    // Limpiar datos sensibles si es necesario
    const datosAnteriores = data.datos_anteriores ? cleanSensitiveData(data.datos_anteriores) : null;
    const datosNuevos = data.datos_nuevos ? cleanSensitiveData(data.datos_nuevos) : null;
    
    await sql`
      INSERT INTO tblauditoria (
        usuario,
        accion,
        tabla_afectada,
        query_text,
        datos_anteriores,
        datos_nuevos
      ) VALUES (
        ${usuario},
        ${data.accion},
        ${data.tabla_afectada},
        ${data.query_text || null},
        ${datosAnteriores ? JSON.stringify(datosAnteriores) : null}::jsonb,
        ${datosNuevos ? JSON.stringify(datosNuevos) : null}::jsonb
      )
    `;
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
    // No lanzamos el error para que no afecte la operación principal
  }
}

// Función para limpiar datos sensibles (como contraseñas)
function cleanSensitiveData(data: any): any {
  if (!data) return null;
  
  const cleaned = { ...data };
  const sensitiveFields = ['password', 'password_hash', 'token', 'recovery_token', 'code'];
  
  sensitiveFields.forEach(field => {
    if (cleaned[field]) {
      cleaned[field] = '***REDACTED***';
    }
  });
  
  return cleaned;
}

// Función para obtener el usuario actual
export async function getCurrentUser(): Promise<string> {
  try {
    const session = await getServerSession(authConfig);
    if (session?.user) {
      return session.user.username || session.user.email || 'usuario_desconocido';
    }
    return 'usuario_desconocido';
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return 'usuario_desconocido';
  }
}

// Función para obtener el historial de auditoría
export async function getAuditoria(
  limit: number = 100,
  offset: number = 0,
  filtros?: {
    usuario?: string;
    accion?: string;
    tabla?: string;
    desde?: Date;
    hasta?: Date;
  }
): Promise<{ data: any[]; total: number }> {
  try {
    let whereConditions = [];
    let params: any[] = [];
    
    if (filtros?.usuario) {
      whereConditions.push(`usuario ILIKE $${params.length + 1}`);
      params.push(`%${filtros.usuario}%`);
    }
    
    if (filtros?.accion) {
      whereConditions.push(`accion = $${params.length + 1}`);
      params.push(filtros.accion);
    }
    
    if (filtros?.tabla) {
      whereConditions.push(`tabla_afectada = $${params.length + 1}`);
      params.push(filtros.tabla);
    }
    
    if (filtros?.desde) {
      whereConditions.push(`created_at >= $${params.length + 1}`);
      params.push(filtros.desde);
    }
    
    if (filtros?.hasta) {
      whereConditions.push(`created_at <= $${params.length + 1}`);
      params.push(filtros.hasta);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    // Construir la consulta con parámetros
    let queryText = `
      SELECT * FROM tblauditoria
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    
    let countQueryText = `
      SELECT COUNT(*) as count FROM tblauditoria
      ${whereClause}
    `;
    
    const [data, totalResult] = await Promise.all([
      sql.unsafe(queryText, params),
      sql.unsafe(countQueryText, params)
    ]);
    
    return {
      data: data.map((row: any) => ({
        ...row,
        datos_anteriores: row.datos_anteriores ? 
          (typeof row.datos_anteriores === 'string' ? JSON.parse(row.datos_anteriores) : row.datos_anteriores) : null,
        datos_nuevos: row.datos_nuevos ? 
          (typeof row.datos_nuevos === 'string' ? JSON.parse(row.datos_nuevos) : row.datos_nuevos) : null
      })),
      total: Number(totalResult[0].count)
    };
  } catch (error) {
    console.error('Error al obtener auditoría:', error);
    throw new Error('No se pudo obtener el historial de auditoría');
  }
}