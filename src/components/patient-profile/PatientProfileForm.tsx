'use client';

import { useState, useEffect } from 'react';
import { updatePatientProfile, updateUserProfile, changePassword } from '@/lib/patient-profile-actions';
import { toast } from 'react-hot-toast';

interface PatientProfileFormProps {
  initialProfile: any;
  userId: number;
}

export default function PatientProfileForm({ initialProfile, userId }: PatientProfileFormProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'account' | 'password'>('personal');
  const [loading, setLoading] = useState(false);
  
  // Estado para datos personales
  const [personalData, setPersonalData] = useState({
    first_name: initialProfile.first_name || '',
    second_name: initialProfile.second_name || '',
    first_lastname: initialProfile.first_lastname || '',
    second_lastname: initialProfile.second_lastname || '',
    age: initialProfile.age || '',
    gender: initialProfile.gender || '',
    phone: initialProfile.phone || '',
    fecha_nacimiento: initialProfile.fecha_nacimiento ? new Date(initialProfile.fecha_nacimiento).toISOString().split('T')[0] : '',
    estado_civil: initialProfile.estado_civil || '',
    ocupacion: initialProfile.ocupacion || ''
  });
  
  // Estado para datos de cuenta
  const [accountData, setAccountData] = useState({
    username: initialProfile.username || '',
    email: initialProfile.email || ''
  });
  
  // Estado para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Función para calcular la edad a partir de la fecha de nacimiento
  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return '';
    
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    
    return edad.toString();
  };

  // Actualizar edad automáticamente cuando cambia la fecha de nacimiento
  const handleFechaNacimientoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fecha = e.target.value;
    const nuevaEdad = calcularEdad(fecha);
    
    setPersonalData(prev => ({
      ...prev,
      fecha_nacimiento: fecha,
      age: nuevaEdad
    }));
  };

  // Permitir edición manual de edad (por si acaso)
  const handleEdadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalData(prev => ({
      ...prev,
      age: e.target.value
    }));
  };

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updatePatientProfile(initialProfile.patient_id, {
        first_name: personalData.first_name,
        second_name: personalData.second_name || null,
        first_lastname: personalData.first_lastname,
        second_lastname: personalData.second_lastname || null,
        age: parseInt(personalData.age),
        gender: personalData.gender || null,
        phone: personalData.phone || null,
        fecha_nacimiento: personalData.fecha_nacimiento ? new Date(personalData.fecha_nacimiento) : null,
        estado_civil: personalData.estado_civil || null,
        ocupacion: personalData.ocupacion || null
      });
      toast.success('Datos personales actualizados');
    } catch (error) {
      toast.error('Error al actualizar datos personales');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateUserProfile(userId, {
        username: accountData.username,
        email: accountData.email
      });
      toast.success('Datos de cuenta actualizados');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar datos de cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    
    try {
      await changePassword(userId, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      toast.success('Contraseña actualizada correctamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
      {/* Encabezado */}
      <div className="bg-[#5A8C7A] px-6 py-4">
        <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
        <p className="text-sm text-white/80 mt-1">Gestiona tu información personal y de cuenta</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E6E3DE] bg-[#FAF9F7]">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'personal' 
              ? 'text-[#5A8C7A] border-b-2 border-[#5A8C7A] bg-white' 
              : 'text-[#6E7C72] hover:text-[#2C3E34]'
          }`}
        >
          Datos Personales
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'account' 
              ? 'text-[#5A8C7A] border-b-2 border-[#5A8C7A] bg-white' 
              : 'text-[#6E7C72] hover:text-[#2C3E34]'
          }`}
        >
          Datos de Cuenta
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'password' 
              ? 'text-[#5A8C7A] border-b-2 border-[#5A8C7A] bg-white' 
              : 'text-[#6E7C72] hover:text-[#2C3E34]'
          }`}
        >
          Cambiar Contraseña
        </button>
      </div>

      <div className="p-6">
        {/* Datos Personales */}
        {activeTab === 'personal' && (
          <form onSubmit={handlePersonalSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={personalData.first_name}
                  onChange={(e) => setPersonalData({ ...personalData, first_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Segundo Nombre
                </label>
                <input
                  type="text"
                  value={personalData.second_name}
                  onChange={(e) => setPersonalData({ ...personalData, second_name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  value={personalData.first_lastname}
                  onChange={(e) => setPersonalData({ ...personalData, first_lastname: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Apellido Materno
                </label>
                <input
                  type="text"
                  value={personalData.second_lastname}
                  onChange={(e) => setPersonalData({ ...personalData, second_lastname: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={personalData.fecha_nacimiento}
                  onChange={handleFechaNacimientoChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                />
                <p className="text-xs text-[#6E7C72] mt-1">La edad se calculará automáticamente</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Edad
                </label>
                <input
                  type="number"
                  value={personalData.age}
                  onChange={handleEdadChange}
                  min="0"
                  max="120"
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent bg-[#FAF9F7]"
                />
                <p className="text-xs text-[#6E7C72] mt-1">
                  {personalData.fecha_nacimiento 
                    ? `Edad calculada: ${calcularEdad(personalData.fecha_nacimiento)} años` 
                    : 'Se calcula automáticamente al seleccionar fecha de nacimiento'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Género
                </label>
                <select
                  value={personalData.gender}
                  onChange={(e) => setPersonalData({ ...personalData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                >
                  <option value="">Seleccionar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={personalData.phone}
                  onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Estado Civil
                </label>
                <select
                  value={personalData.estado_civil}
                  onChange={(e) => setPersonalData({ ...personalData, estado_civil: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                >
                  <option value="">Seleccionar</option>
                  <option value="Soltero/a">Soltero/a</option>
                  <option value="Casado/a">Casado/a</option>
                  <option value="Divorciado/a">Divorciado/a</option>
                  <option value="Viudo/a">Viudo/a</option>
                  <option value="Unión libre">Unión libre</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Ocupación
                </label>
                <input
                  type="text"
                  value={personalData.ocupacion}
                  onChange={(e) => setPersonalData({ ...personalData, ocupacion: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="bg-[#FAF9F7] p-4 rounded-lg border border-[#E6E3DE]">
              <p className="text-sm text-[#6E7C72]">
                <strong className="text-[#2C3E34]">Nota:</strong> La edad se calcula automáticamente al seleccionar tu fecha de nacimiento. 
                Si necesitas corregir la edad, puedes hacerlo manualmente.
              </p>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-[#E6E3DE]">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] transition-colors font-semibold disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}

        {/* Datos de Cuenta */}
        {activeTab === 'account' && (
          <form onSubmit={handleAccountSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Nombre de Usuario *
                </label>
                <input
                  type="text"
                  value={accountData.username}
                  onChange={(e) => setAccountData({ ...accountData, username: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                />
                <p className="text-xs text-[#6E7C72] mt-1">Nombre que usarás para iniciar sesión</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                />
                <p className="text-xs text-[#6E7C72] mt-1">Usado para notificaciones y recuperación de cuenta</p>
              </div>
            </div>
            
            <div className="bg-[#FAF9F7] p-4 rounded-lg border border-[#E6E3DE]">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${initialProfile.verified ? 'bg-[#A8CF45]' : 'bg-[#F58634]'}`}></div>
                <span className="text-sm text-[#2C3E34]">
                  {initialProfile.verified ? 'Correo verificado' : 'Correo no verificado'}
                </span>
              </div>
              {!initialProfile.verified && (
                <p className="text-xs text-[#6E7C72] mt-2">
                  Para verificar tu correo, contacta al administrador del sistema.
                </p>
              )}
            </div>
            
            <div className="flex justify-end pt-4 border-t border-[#E6E3DE]">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] transition-colors font-semibold disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}

        {/* Cambiar Contraseña */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Contraseña Actual *
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                />
                <p className="text-xs text-[#6E7C72] mt-1">Mínimo 8 caracteres</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#5A8C7A] focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="bg-[#FAF9F7] p-4 rounded-lg border border-[#E6E3DE]">
              <p className="text-sm text-[#6E7C72]">
                <strong className="text-[#2C3E34]">Recomendaciones de seguridad:</strong>
              </p>
              <ul className="text-xs text-[#6E7C72] mt-2 space-y-1 list-disc list-inside">
                <li>Usa al menos 8 caracteres</li>
                <li>Combina letras mayúsculas y minúsculas</li>
                <li>Incluye números y símbolos</li>
                <li>No uses contraseñas que hayas usado antes</li>
              </ul>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-[#E6E3DE]">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] transition-colors font-semibold disabled:opacity-50"
              >
                {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}