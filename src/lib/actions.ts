'use server';

import postgres from 'postgres';
import bycript from 'bcrypt';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function updateContrasena(id: string, formData: FormData) {
  const contrasena = formData.get('contrasena') as string;

  try {
    const hashedContrasena = await bycript.hash(contrasena, 10);

    await sql`
      UPDATE tblusers
      SET password = ${hashedContrasena}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    throw new Error('No se pudo actualizar la contraseña');
  }
}

function generarContrasena() {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let contrasena = '';
  
  // Asegurar al menos un número y una letra mayúscula
  const mayuscula = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';
  
  // Primer carácter: letra mayúscula
  contrasena += mayuscula.charAt(Math.floor(Math.random() * mayuscula.length));
  
  // Segundo carácter: número
  contrasena += numeros.charAt(Math.floor(Math.random() * numeros.length));
  
  // Resto de caracteres: mezcla aleatoria
  for (let i = 0; i < 6; i++) {
    const indice = Math.floor(Math.random() * caracteres.length);
    contrasena += caracteres.charAt(indice);
  }
  
  // Mezclar los caracteres para mayor aleatoriedad
  return contrasena.split('').sort(() => Math.random() - 0.5).join('');
}

export async function crearPaciente(formData: FormData) {
  // Extraer datos del formulario
  const firstName = formData.get('first_name') as string;
  const secondName = formData.get('second_name') as string | null;
  const lastName = formData.get('last_name') as string;
  const secondLastName = formData.get('second_last_name') as string | null;
  const age = formData.get('age') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  
  // Validaciones básicas
  if (!firstName || !lastName || !age || !phone || !email) {
    throw new Error('Todos los campos obligatorios son requeridos');
  }
  
  if (phone.length !== 10) {
    throw new Error('El teléfono debe tener 10 dígitos');
  }
  
  try {
    // Generar contraseña aleatoria
    const contrasenaPlana = generarContrasena();
    
    // Hashear la contraseña
    const hashedContrasena = await bycript.hash(contrasenaPlana, 10);
    
    // Insertar el paciente en la base de datos
    const [paciente] = await sql`
      INSERT INTO tblpatients (
        first_name,
        second_name,
        last_name,
        second_last_name,
        age,
        phone,
        email,
        password,
        verified
      ) VALUES (
        ${firstName.trim()},
        ${secondName?.trim() || null},
        ${lastName.trim()},
        ${secondLastName?.trim() || null},
        ${parseInt(age)},
        ${phone.trim()},
        ${email.trim().toLowerCase()},
        ${hashedContrasena},
        false,
      ) RETURNING id, email, first_name, last_name
    `;
    
    return {
      success: true,
      message: 'Paciente creado exitosamente',
      pacienteId: paciente.id,
      nombre: `${paciente.first_name} ${paciente.last_name}`,
      email: paciente.email,
      contrasenaGenerada: contrasenaPlana,
      contrasena: contrasenaPlana
    };
    
  } catch (error) {
    console.error('Error al crear paciente:', error);
    
    // Manejo específico de error de duplicación de email
    if (error instanceof Error && error.message.includes('unique constraint')) {
      throw new Error('El correo electrónico ya está registrado');
    }
    
    throw new Error('No se pudo crear el paciente');
  }
}