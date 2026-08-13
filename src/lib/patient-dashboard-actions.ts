'use server';

import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Obtener datos del paciente por ID de usuario
export async function getPatientByUserId(userId: number) {
  try {
    const [patient] = await sql`
      SELECT p.*, u.email, u.username
      FROM tblpatients p
      JOIN tblusers u ON p.user_id = u.id
      WHERE u.id = ${userId} AND p.active = true
    `;
    return patient;
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    return null;
  }
}

// Obtener próximas citas del paciente
export async function getUpcomingAppointments(patientId: number, limit: number = 5) {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const appointments = await sql`
      SELECT 
        a.id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.deposit_paid,
        a.deposit_amount,
        a.notes
      FROM tblappointments a
      WHERE a.patient_id = ${patientId}
        AND a.appointment_date >= ${todayStr}
        AND a.status NOT IN ('cancelled', 'no_show')
      ORDER BY a.appointment_date ASC, a.start_time ASC
      LIMIT ${limit}
    `;
    
    return appointments;
  } catch (error) {
    console.error('Error al obtener próximas citas:', error);
    return [];
  }
}

// Obtener historial de citas del paciente
export async function getAppointmentHistory(patientId: number, limit: number = 10) {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const appointments = await sql`
      SELECT 
        a.id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.deposit_paid,
        a.deposit_amount,
        a.notes
      FROM tblappointments a
      WHERE a.patient_id = ${patientId}
        AND a.appointment_date < ${todayStr}
        AND a.status NOT IN ('cancelled', 'no_show')
      ORDER BY a.appointment_date DESC, a.start_time DESC
      LIMIT ${limit}
    `;
    
    return appointments;
  } catch (error) {
    console.error('Error al obtener historial de citas:', error);
    return [];
  }
}

// Obtener estadísticas del paciente
export async function getPatientStats(patientId: number) {
  try {
    // Total de citas
    const [totalAppointments] = await sql`
      SELECT COUNT(*) as count FROM tblappointments
      WHERE patient_id = ${patientId} AND status NOT IN ('cancelled', 'no_show')
    `;
    
    // Citas completadas
    const [completedAppointments] = await sql`
      SELECT COUNT(*) as count FROM tblappointments
      WHERE patient_id = ${patientId} AND status = 'completed'
    `;
    
    // Próxima cita
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const [nextAppointment] = await sql`
      SELECT 
        a.appointment_date,
        a.start_time
      FROM tblappointments a
      WHERE a.patient_id = ${patientId}
        AND a.appointment_date >= ${todayStr}
        AND a.status NOT IN ('cancelled', 'no_show')
      ORDER BY a.appointment_date ASC, a.start_time ASC
      LIMIT 1
    `;
    
    // Última evaluación de seguimiento (para ver progreso)
    const [lastEvaluation] = await sql`
      SELECT 
        ant.weight,
        ant.body_fat_percentage,
        ant.muscle_percentage,
        ant.waist_circumference,
        ce.evaluation_date
      FROM tblclinical_evaluations ce
      JOIN tblanthropometric ant ON ce.id = ant.evaluation_id
      WHERE ce.patient_id = ${patientId} 
        AND ce.evaluation_type = 'followup'
        AND ant.weight IS NOT NULL
      ORDER BY ce.evaluation_date DESC
      LIMIT 1
    `;
    
    // Peso inicial (primera evaluación)
    const [initialEvaluation] = await sql`
      SELECT 
        ant.weight
      FROM tblclinical_evaluations ce
      JOIN tblanthropometric ant ON ce.id = ant.evaluation_id
      WHERE ce.patient_id = ${patientId} 
        AND ce.evaluation_type = 'followup'
        AND ant.weight IS NOT NULL
      ORDER BY ce.evaluation_date ASC
      LIMIT 1
    `;
    
    return {
      totalCitas: Number(totalAppointments.count),
      citasCompletadas: Number(completedAppointments.count),
      proximaCita: nextAppointment || null,
      pesoActual: lastEvaluation?.weight ? Number(lastEvaluation.weight) : null,
      pesoInicial: initialEvaluation?.weight ? Number(initialEvaluation.weight) : null,
      grasaActual: lastEvaluation?.body_fat_percentage ? Number(lastEvaluation.body_fat_percentage) : null,
      musculoActual: lastEvaluation?.muscle_percentage ? Number(lastEvaluation.muscle_percentage) : null,
      cinturaActual: lastEvaluation?.waist_circumference ? Number(lastEvaluation.waist_circumference) : null,
      ultimaEvaluacion: lastEvaluation?.evaluation_date || null
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return {
      totalCitas: 0,
      citasCompletadas: 0,
      proximaCita: null,
      pesoActual: null,
      pesoInicial: null,
      grasaActual: null,
      musculoActual: null,
      cinturaActual: null,
      ultimaEvaluacion: null
    };
  }
}

// Obtener publicaciones del muro (para pacientes)
export async function getPatientPosts() {
  try {
    const posts = await sql`
      SELECT p.*, u.username
      FROM tblposts p
      JOIN tblusers u ON p.created_by = u.id
      WHERE p.is_active = true
      ORDER BY p.created_at DESC
      LIMIT 5
    `;
    
    // Obtener imágenes para cada post
    const postsWithImages = await Promise.all(
      posts.map(async (post) => {
        const images = await sql`
          SELECT image_url FROM tblpost_images
          WHERE post_id = ${post.id}
          ORDER BY display_order ASC
        `;
        return {
          ...post,
          images: images.map(img => img.image_url)
        };
      })
    );
    
    return postsWithImages;
  } catch (error) {
    console.error('Error al obtener publicaciones:', error);
    return [];
  }
}