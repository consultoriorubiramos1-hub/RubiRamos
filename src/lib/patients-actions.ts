'use server';

import postgres from 'postgres';
import { revalidatePath } from 'next/cache';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Obtener todos los pacientes con paginación y filtros
export async function getPatients(params?: {
  search?: string;
  gender?: string;
  sortBy?: 'first_name' | 'first_lastname' | 'email' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}) {
  try {
    const {
      search,
      gender,
      sortBy = 'first_name',
      sortOrder = 'asc',
      page = 1,
      pageSize = 10
    } = params || {};
    
    const offset = (page - 1) * pageSize;
    let whereConditions = [];
    let queryParams: any[] = [];
    let paramIndex = 1;
    
    whereConditions.push(`p.active = true AND u.active = true`);
    
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereConditions.push(`(
        p.first_name ILIKE $${paramIndex} OR
        p.second_name ILIKE $${paramIndex} OR
        p.first_lastname ILIKE $${paramIndex} OR
        p.second_lastname ILIKE $${paramIndex} OR
        u.email ILIKE $${paramIndex} OR
        u.username ILIKE $${paramIndex}
      )`);
      queryParams.push(searchTerm);
      paramIndex++;
    }
    
    if (gender && gender !== 'todos') {
      whereConditions.push(`p.gender = $${paramIndex}`);
      queryParams.push(gender);
      paramIndex++;
    }
    
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    
    // Contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tblpatients p
      JOIN tblusers u ON p.user_id = u.id
      ${whereClause}
    `;
    const totalResult = await sql.unsafe(countQuery, queryParams);
    const total = Number(totalResult[0].total);
    
    // Mapeo de ordenamiento
    const sortColumnMap = {
      first_name: 'p.first_name',
      first_lastname: 'p.first_lastname',
      email: 'u.email',
      created_at: 'p.created_at'
    };
    const sortColumn = sortColumnMap[sortBy] || 'p.first_name';
    const sortDirection = sortOrder === 'desc' ? 'DESC' : 'ASC';
    
    // Obtener pacientes
    const dataQuery = `
      SELECT p.*, u.email, u.username
      FROM tblpatients p
      JOIN tblusers u ON p.user_id = u.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;
    const patients = await sql.unsafe(dataQuery, queryParams);
    
    return {
      patients: patients.map(patient => ({
        ...patient,
        nombre_completo: `${patient.first_name} ${patient.second_name || ''} ${patient.first_lastname} ${patient.second_lastname || ''}`.trim().replace(/\s+/g, ' ')
      })),
      total
    };
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    throw new Error('No se pudieron obtener los pacientes');
  }
}

// Obtener paciente por ID
// Obtener paciente por ID
export async function getPatientById(id: number) {
  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('El identificador del paciente no es válido');
    }

    const [patient] = await sql`
      SELECT
        p.*,
        u.email,
        u.username
      FROM tblpatients p
      JOIN tblusers u
        ON p.user_id = u.id
      WHERE p.id = ${id}
        AND p.active = true
        AND u.active = true
      LIMIT 1
    `;

    if (!patient) {
      return null;
    }

    // Obtener estadísticas de asistencia del paciente.
    const [stats] = await sql`
      SELECT
        COUNT(*) AS total_citas,

        COUNT(*) FILTER (
          WHERE status IN ('scheduled', 'confirmed')
            AND (
              appointment_date >
                (
                  NOW()
                  AT TIME ZONE 'America/Mexico_City'
                )::date
              OR (
                appointment_date =
                  (
                    NOW()
                    AT TIME ZONE 'America/Mexico_City'
                  )::date
                AND start_time >
                  (
                    NOW()
                    AT TIME ZONE 'America/Mexico_City'
                  )::time
              )
            )
        ) AS proximas_citas,

        COUNT(*) FILTER (
          WHERE status = 'completed'
        ) AS citas_completadas,

        COUNT(*) FILTER (
          WHERE status = 'no_show'
        ) AS inasistencias,

        COUNT(*) FILTER (
          WHERE status = 'cancelled'
        ) AS canceladas,

        COUNT(*) FILTER (
          WHERE status IN ('completed', 'no_show')
        ) AS citas_anteriores,

        COALESCE(
          ROUND(
            (
              100.0 *
              COUNT(*) FILTER (
                WHERE status = 'completed'
              )
            ) /
            NULLIF(
              COUNT(*) FILTER (
                WHERE status IN (
                  'completed',
                  'no_show'
                )
              ),
              0
            ),
            1
          ),
          0
        ) AS porcentaje_asistencia

      FROM tblappointments
      WHERE patient_id = ${id}
    `;

    // Obtener la próxima cita realmente pendiente.
    const [nextAppointment] = await sql`
      SELECT
        a.*,
        p.first_name,
        p.second_name,
        p.first_lastname,
        p.second_lastname
      FROM tblappointments a
      JOIN tblpatients p
        ON a.patient_id = p.id
      WHERE a.patient_id = ${id}
        AND a.status IN ('scheduled', 'confirmed')
        AND (
          a.appointment_date >
            (
              NOW()
              AT TIME ZONE 'America/Mexico_City'
            )::date
          OR (
            a.appointment_date =
              (
                NOW()
                AT TIME ZONE 'America/Mexico_City'
              )::date
            AND a.start_time >
              (
                NOW()
                AT TIME ZONE 'America/Mexico_City'
              )::time
          )
        )
      ORDER BY
        a.appointment_date ASC,
        a.start_time ASC
      LIMIT 1
    `;

    /*
     * Obtener historial de citas.
     *
     * Se incluyen las completadas, inasistencias,
     * canceladas, programadas y confirmadas para que
     * la nutrióloga pueda consultar el registro completo.
     */
    const appointmentHistory = await sql`
      SELECT
        a.*,
        p.first_name,
        p.second_name,
        p.first_lastname,
        p.second_lastname
      FROM tblappointments a
      JOIN tblpatients p
        ON a.patient_id = p.id
      WHERE a.patient_id = ${id}
      ORDER BY
        a.appointment_date DESC,
        a.start_time DESC
      LIMIT 10
    `;

    return {
      ...patient,

      nombre_completo:
        `${patient.first_name} ` +
        `${patient.second_name || ''} ` +
        `${patient.first_lastname} ` +
        `${patient.second_lastname || ''}`
          .trim()
          .replace(/\s+/g, ' '),

      estadisticas: {
        total_citas:
          Number(stats?.total_citas) || 0,

        proximas_citas:
          Number(stats?.proximas_citas) || 0,

        citas_anteriores:
          Number(stats?.citas_anteriores) || 0,

        citas_completadas:
          Number(stats?.citas_completadas) || 0,

        inasistencias:
          Number(stats?.inasistencias) || 0,

        canceladas:
          Number(stats?.canceladas) || 0,

        porcentaje_asistencia:
          Number(stats?.porcentaje_asistencia) || 0
      },

      proxima_cita: nextAppointment || null,

      historial_citas: appointmentHistory.map(
        appointment => ({
          ...appointment,

          nombre_completo:
            `${appointment.first_name} ` +
            `${appointment.second_name || ''} ` +
            `${appointment.first_lastname} ` +
            `${appointment.second_lastname || ''}`
              .trim()
              .replace(/\s+/g, ' ')
        })
      )
    };
  } catch (error) {
    console.error(
      'Error al obtener paciente por ID:',
      error
    );

    throw new Error(
      error instanceof Error
        ? error.message
        : 'No se pudo obtener el paciente'
    );
  }
}

// Buscar pacientes por término
export async function searchPatients(query: string) {
  try {
    if (!query || query.trim().length < 2) {
      const result = await getPatients();
      return result.patients;
    }
    
    const searchTerm = `%${query.trim()}%`;
    const patients = await sql`
      SELECT p.*, u.email, u.username
      FROM tblpatients p
      JOIN tblusers u ON p.user_id = u.id
      WHERE p.active = true AND u.active = true
        AND (
          p.first_name ILIKE ${searchTerm} OR
          p.second_name ILIKE ${searchTerm} OR
          p.first_lastname ILIKE ${searchTerm} OR
          p.second_lastname ILIKE ${searchTerm} OR
          u.email ILIKE ${searchTerm} OR
          CONCAT(p.first_name, ' ', p.first_lastname) ILIKE ${searchTerm}
        )
      ORDER BY p.first_name, p.first_lastname
      LIMIT 20
    `;
    
    return patients.map(patient => ({
      ...patient,
      nombre_completo: `${patient.first_name} ${patient.second_name || ''} ${patient.first_lastname} ${patient.second_lastname || ''}`.trim().replace(/\s+/g, ' ')
    }));
  } catch (error) {
    console.error('Error al buscar pacientes:', error);
    return [];
  }
}

// Obtener pacientes paginados
export async function getPatientsPaginated(page: number = 1, pageSize: number = 10, search?: string) {
  try {
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE p.active = true AND u.active = true';
    let queryParams: any[] = [];
    let paramIndex = 1;
    
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause += ` AND (
        p.first_name ILIKE $${paramIndex} OR
        p.second_name ILIKE $${paramIndex} OR
        p.first_lastname ILIKE $${paramIndex} OR
        p.second_lastname ILIKE $${paramIndex} OR
        u.email ILIKE $${paramIndex}
      )`;
      queryParams.push(searchTerm);
      paramIndex++;
    }
    
    // Contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tblpatients p
      JOIN tblusers u ON p.user_id = u.id
      ${whereClause}
    `;
    const totalResult = await sql.unsafe(countQuery, queryParams);
    const total = Number(totalResult[0].total);
    
    // Obtener pacientes paginados
    const dataQuery = `
      SELECT p.*, u.email, u.username
      FROM tblpatients p
      JOIN tblusers u ON p.user_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;
    const patients = await sql.unsafe(dataQuery, queryParams);
    
    return {
      patients: patients.map(patient => ({
        ...patient,
        nombre_completo: `${patient.first_name} ${patient.second_name || ''} ${patient.first_lastname} ${patient.second_lastname || ''}`.trim().replace(/\s+/g, ' ')
      })),
      total
    };
  } catch (error) {
    console.error('Error al obtener pacientes paginados:', error);
    throw new Error('No se pudieron obtener los pacientes');
  }
}

// Actualizar paciente
export async function updatePatient(id: number, data: {
  first_name?: string;
  second_name?: string | null;
  first_lastname?: string;
  second_lastname?: string | null;
  age?: number;
  gender?: string | null;
  phone?: string | null;
  notes?: string | null;
  email?: string;
  username?: string;
  fecha_nacimiento?: Date | string | null;
  estado_civil?: string | null;
  ocupacion?: string | null;
}) {
  try {
    // Actualizar datos del paciente
    if (data.first_name !== undefined || data.second_name !== undefined || 
        data.first_lastname !== undefined || data.second_lastname !== undefined || 
        data.age !== undefined || data.gender !== undefined || 
        data.phone !== undefined || data.notes !== undefined ||
        data.fecha_nacimiento !== undefined || data.estado_civil !== undefined ||
        data.ocupacion !== undefined) {
      
      const updates: string[] = [];
      const values: any[] = [];
      
      if (data.first_name !== undefined) {
        updates.push(`first_name = $${values.length + 1}`);
        values.push(data.first_name);
      }
      if (data.second_name !== undefined) {
        updates.push(`second_name = $${values.length + 1}`);
        values.push(data.second_name);
      }
      if (data.first_lastname !== undefined) {
        updates.push(`first_lastname = $${values.length + 1}`);
        values.push(data.first_lastname);
      }
      if (data.second_lastname !== undefined) {
        updates.push(`second_lastname = $${values.length + 1}`);
        values.push(data.second_lastname);
      }
      if (data.age !== undefined) {
        updates.push(`age = $${values.length + 1}`);
        values.push(data.age);
      }
      if (data.gender !== undefined) {
        updates.push(`gender = $${values.length + 1}`);
        values.push(data.gender);
      }
      if (data.phone !== undefined) {
        updates.push(`phone = $${values.length + 1}`);
        values.push(data.phone);
      }
      if (data.notes !== undefined) {
        updates.push(`notes = $${values.length + 1}`);
        values.push(data.notes);
      }
      if (data.fecha_nacimiento !== undefined) {
        updates.push(`fecha_nacimiento = $${values.length + 1}`);
        values.push(data.fecha_nacimiento);
      }
      if (data.estado_civil !== undefined) {
        updates.push(`estado_civil = $${values.length + 1}`);
        values.push(data.estado_civil);
      }
      if (data.ocupacion !== undefined) {
        updates.push(`ocupacion = $${values.length + 1}`);
        values.push(data.ocupacion);
      }
      
      updates.push(`updated_at = NOW()`);
      values.push(id);
      
      if (updates.length > 1) {
        const query = `
          UPDATE tblpatients
          SET ${updates.join(', ')}
          WHERE id = $${values.length}
        `;
        await sql.unsafe(query, values);
      }
    }
    
    // Actualizar datos del usuario
    if (data.email !== undefined || data.username !== undefined) {
      const userUpdates: string[] = [];
      const userValues: any[] = [];
      
      if (data.email !== undefined) {
        userUpdates.push(`email = $${userValues.length + 1}`);
        userValues.push(data.email);
      }
      if (data.username !== undefined) {
        userUpdates.push(`username = $${userValues.length + 1}`);
        userValues.push(data.username);
      }
      
      if (userUpdates.length > 0) {
        userValues.push(id);
        const query = `
          UPDATE tblusers
          SET ${userUpdates.join(', ')}
          WHERE id = (SELECT user_id FROM tblpatients WHERE id = $${userValues.length})
        `;
        await sql.unsafe(query, userValues);
      }
    }
    
    revalidatePath('/admin/patients');
    return { success: true, message: 'Paciente actualizado exitosamente' };
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    throw new Error('No se pudo actualizar el paciente');
  }
}

// Eliminar paciente (eliminación lógica)
export async function deletePatient(id: number) {
  try {
    await sql`
      UPDATE tblpatients
      SET active = false, updated_at = NOW()
      WHERE id = ${id}
    `;
    
    await sql`
      UPDATE tblusers
      SET active = false
      WHERE id = (SELECT user_id FROM tblpatients WHERE id = ${id})
    `;
    
    revalidatePath('/admin/patients');
    return { success: true, message: 'Paciente eliminado exitosamente' };
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    throw new Error('No se pudo eliminar el paciente');
  }
}

// Obtener estadísticas de pacientes
export async function getPatientsStats() {
  try {
    const [total] = await sql`
      SELECT COUNT(*) as count
      FROM tblpatients p
      JOIN tblusers u ON p.user_id = u.id
      WHERE p.active = true AND u.active = true
    `;
    
    const [maleCount] = await sql`
      SELECT COUNT(*) as count
      FROM tblpatients p
      JOIN tblusers u ON p.user_id = u.id
      WHERE p.active = true AND u.active = true AND p.gender = 'M'
    `;
    
    const [femaleCount] = await sql`
      SELECT COUNT(*) as count
      FROM tblpatients p
      JOIN tblusers u ON p.user_id = u.id
      WHERE p.active = true AND u.active = true AND p.gender = 'F'
    `;
    
    const [recentCount] = await sql`
      SELECT COUNT(*) as count
      FROM tblpatients p
      JOIN tblusers u ON p.user_id = u.id
      WHERE p.active = true AND u.active = true 
        AND p.created_at >= NOW() - INTERVAL '30 days'
    `;
    
    return {
      total: Number(total.count),
      masculinos: Number(maleCount.count),
      femeninos: Number(femaleCount.count),
      nuevosUltimos30Dias: Number(recentCount.count)
    };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return {
      total: 0,
      masculinos: 0,
      femeninos: 0,
      nuevosUltimos30Dias: 0
    };
  }
}

// Verificar si el username ya existe
export async function checkUsernameExists(username: string, excludeUserId?: number) {
  try {
    let query = sql`
      SELECT id FROM tblusers WHERE username = ${username} AND active = true
    `;
    const result = await query;
    return result.length > 0;
  } catch (error) {
    console.error('Error al verificar username:', error);
    return false;
  }
}

// Crear nuevo paciente y usuario asociado
export async function createPatientAndUser(data: {
  username: string;
  email: string;
  first_name: string;
  second_name?: string | null;
  first_lastname: string;
  second_lastname?: string | null;
  age: number;
  gender?: string | null;
  phone?: string | null;
  notes?: string | null;
  fecha_nacimiento?: Date | string | null;
  estado_civil?: string | null;
  ocupacion?: string | null;
}) {
  try {
    // Verificar si el email ya existe
    const existingUser = await sql`
      SELECT id FROM tblusers WHERE email = ${data.email}
    `;
    if (existingUser.length > 0) {
      throw new Error('El correo electrónico ya está registrado');
    }
    
    // Verificar si el username ya existe
    const existingUsername = await sql`
      SELECT id FROM tblusers WHERE username = ${data.username}
    `;
    if (existingUsername.length > 0) {
      throw new Error('El nombre de usuario ya existe');
    }

    // Crear usuario con rol_id=2 (paciente), password_hash = 'x' para que tenga que recuperar
    const [newUser] = await sql`
      INSERT INTO tblusers (rol_id, username, email, password_hash, verified, active)
      VALUES (2, ${data.username}, ${data.email}, 'x', false, true)
      RETURNING id
    `;

    // Crear paciente con los nuevos campos
    const [newPatient] = await sql`
      INSERT INTO tblpatients (
        user_id, first_name, second_name, first_lastname, second_lastname,
        age, gender, phone, notes, active,
        fecha_nacimiento, estado_civil, ocupacion
      ) VALUES (
        ${newUser.id}, ${data.first_name}, ${data.second_name || null},
        ${data.first_lastname}, ${data.second_lastname || null},
        ${data.age}, ${data.gender || null}, ${data.phone || null},
        ${data.notes || null}, true,
        ${data.fecha_nacimiento || null}, ${data.estado_civil || null},
        ${data.ocupacion || null}
      )
      RETURNING id
    `;

    return { success: true, patientId: newPatient.id, userId: newUser.id };
  } catch (error) {
    console.error('Error al crear paciente y usuario:', error);
    throw new Error(error instanceof Error ? error.message : 'Error al crear paciente');
  }
}