'use server';

import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Obtener todas las recomendaciones activas
export async function getGeneralRecommendations() {
  try {
    const recommendations = await sql`
      SELECT * FROM tblgeneral_recommendations
      WHERE is_active = true
      ORDER BY display_order ASC
    `;
    return recommendations;
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error);
    return [];
  }
}