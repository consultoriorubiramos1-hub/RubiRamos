'use server';

import postgres from 'postgres';
import bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Obtener perfil completo del paciente
export async function getPatientProfile(userId: number) {
  try {
    const [profile] = await sql`
      SELECT 
        u.id as user_id,
        u.username,
        u.email,
        u.verified,
        u.active,
        p.id as patient_id,
        p.first_name,
        p.second_name,
        p.first_lastname,
        p.second_lastname,
        p.age,
        p.gender,
        p.phone,
        p.fecha_nacimiento,
        p.estado_civil,
        p.ocupacion,
        p.notes as patient_notes
      FROM tblusers u
      JOIN tblpatients p ON u.id = p.user_id
      WHERE u.id = ${userId} AND u.active = true
    `;
    
    if (!profile) return null;
    
    return {
      user_id: profile.user_id,
      username: profile.username,
      email: profile.email,
      verified: profile.verified,
      active: profile.active,
      patient_id: profile.patient_id,
      first_name: profile.first_name,
      second_name: profile.second_name,
      first_lastname: profile.first_lastname,
      second_lastname: profile.second_lastname,
      nombre_completo: `${profile.first_name} ${profile.second_name || ''} ${profile.first_lastname} ${profile.second_lastname || ''}`.trim().replace(/\s+/g, ' '),
      age: profile.age,
      gender: profile.gender,
      phone: profile.phone,
      fecha_nacimiento: profile.fecha_nacimiento,
      estado_civil: profile.estado_civil,
      ocupacion: profile.ocupacion,
      notes: profile.patient_notes
    };
  } catch (error) {
    console.error('Error al obtener perfil del paciente:', error);
    throw new Error('No se pudo obtener el perfil');
  }
}

// Actualizar información del paciente (tblpatients)
export async function updatePatientProfile(patientId: number, data: {
  first_name: string;
  second_name?: string | null;
  first_lastname: string;
  second_lastname?: string | null;
  age: number;
  gender?: string | null;
  phone?: string | null;
  fecha_nacimiento?: Date | null;
  estado_civil?: string | null;
  ocupacion?: string | null;
}) {
  try {
    await sql`
      UPDATE tblpatients
      SET 
        first_name = ${data.first_name},
        second_name = ${data.second_name || null},
        first_lastname = ${data.first_lastname},
        second_lastname = ${data.second_lastname || null},
        age = ${data.age},
        gender = ${data.gender || null},
        phone = ${data.phone || null},
        fecha_nacimiento = ${data.fecha_nacimiento || null},
        estado_civil = ${data.estado_civil || null},
        ocupacion = ${data.ocupacion || null},
        updated_at = NOW()
      WHERE id = ${patientId}
    `;
    
    revalidatePath('/patient/perfil');
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar perfil del paciente:', error);
    throw new Error('No se pudo actualizar el perfil');
  }
}

// Actualizar información del usuario (tblusers)
export async function updateUserProfile(userId: number, data: {
  username?: string;
  email?: string;
}) {
  try {
    // Verificar si el nuevo username ya existe (si cambió)
    if (data.username) {
      const [existingUser] = await sql`
        SELECT id FROM tblusers 
        WHERE username = ${data.username} AND id != ${userId}
      `;
      if (existingUser) {
        throw new Error('El nombre de usuario ya está en uso');
      }
    }
    
    // Verificar si el nuevo email ya existe (si cambió)
    if (data.email) {
      const [existingEmail] = await sql`
        SELECT id FROM tblusers 
        WHERE email = ${data.email} AND id != ${userId}
      `;
      if (existingEmail) {
        throw new Error('El correo electrónico ya está registrado');
      }
    }
    
    const updates: Record<string, any> = { updated_at: new Date() };
    if (data.username) updates.username = data.username;
    if (data.email) updates.email = data.email;
    
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ${sql.unsafe(`$${Object.keys(updates).indexOf(key) + 1}`)}`)
      .join(', ');
    
    await sql.unsafe(`
      UPDATE tblusers
      SET ${setClause}
      WHERE id = ${userId}
    `);
    
    revalidatePath('/patient/perfil');
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw new Error(error instanceof Error ? error.message : 'No se pudo actualizar el usuario');
  }
}

// Cambiar contraseña
export async function changePassword(userId: number, data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    // Validar que las contraseñas coincidan
    if (data.newPassword !== data.confirmPassword) {
      throw new Error('Las contraseñas nuevas no coinciden');
    }
    
    // Validar longitud mínima
    if (data.newPassword.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    
    // Obtener la contraseña actual del usuario
    const [user] = await sql`
      SELECT password_hash FROM tblusers WHERE id = ${userId}
    `;
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    // Verificar contraseña actual
    const isValid = await bcrypt.compare(data.currentPassword, user.password_hash);
    if (!isValid) {
      throw new Error('Contraseña actual incorrecta');
    }
    
    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    
    // Actualizar contraseña
    await sql`
      UPDATE tblusers
      SET password_hash = ${hashedPassword}, updated_at = NOW()
      WHERE id = ${userId}
    `;
    
    revalidatePath('/patient/perfil');
    return { success: true };
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    throw new Error(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña');
  }
}