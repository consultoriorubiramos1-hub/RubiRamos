'use server';

import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export interface MetricasBaseDatos {
  // Sesiones activas
  sesiones_activas: {
    total: number;
    detalle: Array<{
      pid: number;
      usuario: string;
      aplicacion: string;
      cliente: string;
      estado: string;
      tiempo_conexion: string;
      query_actual: string | null;
    }>;
  };
  
  // Tamaño total de la base de datos
  tamano_total: {
    bytes: number;
    humano: string;
    detalle_por_tabla: Array<{
      nombre_tabla: string;
      tamano_bytes: number;
      tamano_humano: string;
      porcentaje: number;
    }>;
  };
  
  // Tablas con más peso
  tablas_mas_pesadas: Array<{
    nombre_tabla: string;
    tamano_total_bytes: number;
    tamano_total_humano: string;
    tamano_datos_bytes: number;
    tamano_datos_humano: string;
    tamano_indices_bytes: number;
    tamano_indices_humano: string;
    numero_filas: number;
    porcentaje_total: number;
  }>;
  
  // Estadísticas adicionales
  estadisticas: {
    total_tablas: number;
    total_indices: number;
    total_vistas: number;
    ultimo_vacuum: Date | null;
    ultimo_analyze: Date | null;
    conexiones_maximas: number;
    conexiones_actuales: number;
  };
}

export async function obtenerMetricasBaseDatos(): Promise<MetricasBaseDatos> {
  try {
    // 1. Obtener sesiones activas
    const sesionesActivas = await obtenerSesionesActivas();
    
    // 2. Obtener tamaño total de la base de datos
    const tamanoTotal = await obtenerTamanoTotalBaseDatos();
    
    // 3. Obtener tablas más pesadas
    const tablasMasPesadas = await obtenerTablasMasPesadas();
    
    // 4. Obtener estadísticas adicionales
    const estadisticas = await obtenerEstadisticasAdicionales();
    
    return {
      sesiones_activas: sesionesActivas,
      tamano_total: tamanoTotal,
      tablas_mas_pesadas: tablasMasPesadas,
      estadisticas
    };
  } catch (error) {
    console.error('Error al obtener métricas de la base de datos:', error);
    throw new Error('No se pudieron obtener las métricas de la base de datos');
  }
}

async function obtenerSesionesActivas() {
  try {
    const sesiones = await sql<any[]>`
      SELECT 
        pid,
        usename as usuario,
        application_name as aplicacion,
        client_addr as cliente,
        state as estado,
        backend_start as tiempo_conexion,
        LEFT(query, 200) as query_actual
      FROM pg_stat_activity 
      WHERE datname = current_database()
        AND pid <> pg_backend_pid()
      ORDER BY backend_start DESC
    `;
    
    return {
      total: sesiones.length,
      detalle: sesiones.map(s => ({
        pid: s.pid,
        usuario: s.usuario,
        aplicacion: s.aplicacion || 'Desconocida',
        cliente: s.cliente ? s.cliente.toString() : 'Local',
        estado: s.estado || 'idle',
        tiempo_conexion: new Date(s.tiempo_conexion).toLocaleString('es-MX'),
        query_actual: s.query_actual || null
      }))
    };
  } catch (error) {
    console.error('Error al obtener sesiones activas:', error);
    return {
      total: 0,
      detalle: []
    };
  }
}

async function obtenerTamanoTotalBaseDatos() {
  try {
    // Obtener tamaño total de la base de datos
    const totalSize = await sql<any[]>`
      SELECT 
        pg_database_size(current_database()) as bytes
    `;
    
    const bytes = Number(totalSize[0].bytes);
    
    // Obtener tamaño por tabla
    const tablasSize = await sql<any[]>`
      SELECT 
        schemaname,
        tablename,
        pg_total_relation_size(schemaname||'.'||tablename) as bytes
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY bytes DESC
      LIMIT 10
    `;
    
    const detalle = tablasSize.map(t => ({
      nombre_tabla: `${t.schemaname}.${t.tablename}`,
      tamano_bytes: Number(t.bytes),
      tamano_humano: formatBytes(Number(t.bytes)),
      porcentaje: (Number(t.bytes) / bytes) * 100
    }));
    
    return {
      bytes,
      humano: formatBytes(bytes),
      detalle_por_tabla: detalle
    };
  } catch (error) {
    console.error('Error al obtener tamaño total:', error);
    return {
      bytes: 0,
      humano: '0 B',
      detalle_por_tabla: []
    };
  }
}

async function obtenerTablasMasPesadas() {
  try {
    // Primero actualizar estadísticas para obtener estimaciones más precisas
    await sql`ANALYZE`;
    
    // Luego obtener la información con estimaciones actualizadas
    const tablas = await sql<any[]>`
      WITH table_stats AS (
        SELECT 
          schemaname,
          tablename,
          schemaname || '.' || tablename as nombre_tabla,
          pg_total_relation_size(schemaname||'.'||tablename) as tamano_total_bytes,
          pg_relation_size(schemaname||'.'||tablename) as tamano_datos_bytes,
          pg_indexes_size(schemaname||'.'||tablename) as tamano_indices_bytes,
          -- Usar reltuples con valor por defecto 0 si es negativo
          GREATEST(reltuples::bigint, 0) as numero_filas_estimado
        FROM pg_tables t
        LEFT JOIN pg_class c ON c.relname = t.tablename 
          AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
        WHERE t.schemaname NOT IN ('pg_catalog', 'information_schema')
      )
      SELECT 
        nombre_tabla,
        tamano_total_bytes,
        tamano_datos_bytes,
        tamano_indices_bytes,
        numero_filas_estimado as numero_filas
      FROM table_stats
      ORDER BY tamano_total_bytes DESC
      LIMIT 10
    `;
    
    const totalDB = await obtenerTamanoTotalBaseDatos();
    
    return tablas.map(t => ({
      nombre_tabla: t.nombre_tabla,
      tamano_total_bytes: Number(t.tamano_total_bytes),
      tamano_total_humano: formatBytes(Number(t.tamano_total_bytes)),
      tamano_datos_bytes: Number(t.tamano_datos_bytes),
      tamano_datos_humano: formatBytes(Number(t.tamano_datos_bytes)),
      tamano_indices_bytes: Number(t.tamano_indices_bytes),
      tamano_indices_humano: formatBytes(Number(t.tamano_indices_bytes)),
      numero_filas: Math.max(Number(t.numero_filas), 0), // Asegurar que no sea negativo
      porcentaje_total: (Number(t.tamano_total_bytes) / totalDB.bytes) * 100
    }));
  } catch (error) {
    console.error('Error al obtener tablas más pesadas:', error);
    return [];
  }
}

async function obtenerEstadisticasAdicionales() {
  try {
    // Obtener total de tablas
    const totalTablas = await sql<any[]>`
      SELECT COUNT(*) as count
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    `;
    
    // Obtener total de índices
    const totalIndices = await sql<any[]>`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    `;
    
    // Obtener total de vistas
    const totalVistas = await sql<any[]>`
      SELECT COUNT(*) as count
      FROM pg_views
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    `;
    
    // Obtener último vacuum y analyze
    const ultimoVacuum = await sql<any[]>`
      SELECT 
        MAX(last_vacuum) as last_vacuum,
        MAX(last_analyze) as last_analyze
      FROM pg_stat_user_tables
    `;
    
    // Obtener conexiones
    const conexiones = await sql<any[]>`
      SELECT 
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
        (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()) as current_connections
    `;
    
    return {
      total_tablas: Number(totalTablas[0].count),
      total_indices: Number(totalIndices[0].count),
      total_vistas: Number(totalVistas[0].count),
      ultimo_vacuum: ultimoVacuum[0].last_vacuum ? new Date(ultimoVacuum[0].last_vacuum) : null,
      ultimo_analyze: ultimoVacuum[0].last_analyze ? new Date(ultimoVacuum[0].last_analyze) : null,
      conexiones_maximas: Number(conexiones[0].max_connections),
      conexiones_actuales: Number(conexiones[0].current_connections)
    };
  } catch (error) {
    console.error('Error al obtener estadísticas adicionales:', error);
    return {
      total_tablas: 0,
      total_indices: 0,
      total_vistas: 0,
      ultimo_vacuum: null,
      ultimo_analyze: null,
      conexiones_maximas: 0,
      conexiones_actuales: 0
    };
  }
}

// Helper para formatear bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}