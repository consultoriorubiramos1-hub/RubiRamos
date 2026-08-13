'use client';

import { useState, useEffect } from 'react';
import { updatePatient } from '@/lib/patients-actions';
import { toast } from 'react-hot-toast';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  mode: 'view' | 'edit';
  onSuccess: () => void;
}

export default function PatientModal({ isOpen, onClose, patient, mode, onSuccess }: PatientModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    second_name: '',
    first_lastname: '',
    second_lastname: '',
    age: '',
    gender: '',
    phone: '',
    notes: '',
    email: '',
    username: '',
    fecha_nacimiento: '',
    estado_civil: '',
    ocupacion: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patient) {
      // Formatear fecha para el input date (YYYY-MM-DD)
      let fechaNacimiento = '';
      if (patient.fecha_nacimiento) {
        const date = new Date(patient.fecha_nacimiento);
        fechaNacimiento = date.toISOString().split('T')[0];
      }
      
      setFormData({
        first_name: patient.first_name || '',
        second_name: patient.second_name || '',
        first_lastname: patient.first_lastname || '',
        second_lastname: patient.second_lastname || '',
        age: patient.age?.toString() || '',
        gender: patient.gender || '',
        phone: patient.phone || '',
        notes: patient.notes || '',
        email: patient.email || '',
        username: patient.username || '',
        fecha_nacimiento: fechaNacimiento,
        estado_civil: patient.estado_civil || '',
        ocupacion: patient.ocupacion || ''
      });
    }
  }, [patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updatePatient(patient.id, {
        first_name: formData.first_name,
        second_name: formData.second_name || null,
        first_lastname: formData.first_lastname,
        second_lastname: formData.second_lastname || null,
        age: parseInt(formData.age),
        gender: formData.gender || null,
        phone: formData.phone || null,
        notes: formData.notes || null,
        email: formData.email,
        username: formData.username,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        estado_civil: formData.estado_civil || null,
        ocupacion: formData.ocupacion || null
      });
      toast.success('Paciente actualizado exitosamente');
      onSuccess();
    } catch (error) {
      toast.error('Error al actualizar paciente');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !patient) return null;

  const isViewMode = mode === 'view';

  // Opciones para estado civil
  const estadoCivilOptions = [
    { value: '', label: 'No especificado' },
    { value: 'Soltero(a)', label: 'Soltero(a)' },
    { value: 'Casado(a)', label: 'Casado(a)' },
    { value: 'Divorciado(a)', label: 'Divorciado(a)' },
    { value: 'Viudo(a)', label: 'Viudo(a)' },
    { value: 'Unión libre', label: 'Unión libre' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#E6E3DE]">
        <div className="sticky top-0 bg-white border-b border-[#E6E3DE] px-6 py-4 bg-[#FAF9F7] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#6B8E7B]">
            {isViewMode ? 'Detalles del Paciente' : 'Editar Paciente'}
          </h2>
          <button onClick={onClose} className="text-[#6E7C72] hover:text-[#2C3E34]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {isViewMode ? (
            // Modo vista - mostrar información
            <div className="space-y-6">
              {/* Información personal */}
              <div>
                <h3 className="text-lg font-semibold text-[#6B8E7B] mb-3">Información Personal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><span className="font-semibold text-[#2C3E34]">Nombre:</span> <span className="text-[#6E7C72]">{patient.first_name} {patient.second_name}</span></div>
                  <div><span className="font-semibold text-[#2C3E34]">Apellidos:</span> <span className="text-[#6E7C72]">{patient.first_lastname} {patient.second_lastname}</span></div>
                  <div><span className="font-semibold text-[#2C3E34]">Edad:</span> <span className="text-[#6E7C72]">{patient.age}</span></div>
                  <div><span className="font-semibold text-[#2C3E34]">Género:</span> <span className="text-[#6E7C72]">{patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : 'No especificado'}</span></div>
                  <div><span className="font-semibold text-[#2C3E34]">Fecha de nacimiento:</span> <span className="text-[#6E7C72]">{patient.fecha_nacimiento ? new Date(patient.fecha_nacimiento).toLocaleDateString('es-ES') : 'No registrada'}</span></div>
                  <div><span className="font-semibold text-[#2C3E34]">Estado civil:</span> <span className="text-[#6E7C72]">{patient.estado_civil || 'No especificado'}</span></div>
                  <div><span className="font-semibold text-[#2C3E34]">Ocupación:</span> <span className="text-[#6E7C72]">{patient.ocupacion || 'No especificada'}</span></div>
                  <div><span className="font-semibold text-[#2C3E34]">Teléfono:</span> <span className="text-[#6E7C72]">{patient.phone || '—'}</span></div>
                  <div><span className="font-semibold text-[#2C3E34]">Correo:</span> <span className="text-[#6E7C72]">{patient.email}</span></div>
                  <div><span className="font-semibold text-[#2C3E34]">Usuario:</span> <span className="text-[#6E7C72]">{patient.username}</span></div>
                </div>
              </div>

              {/* Notas */}
              {patient.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-[#6B8E7B] mb-3">Notas</h3>
                  <p className="text-[#6E7C72] bg-[#FAF9F7] p-3 rounded-lg">{patient.notes}</p>
                </div>
              )}

              {/* Estadísticas de asistencia */}
                <div>
                  <h3 className="mb-3 font-semibold text-[#2C3E34]">
                    Estadísticas de Asistencia
                  </h3>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-[#E6E3DE] bg-[#FAF9F7] p-3 text-center">
                      <p className="text-2xl font-bold text-[#2C3E34]">
                        {patient.estadisticas?.total_citas || 0}
                      </p>
                      <p className="text-xs text-[#6E7C72]">
                        Total de citas
                      </p>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700">
                        {patient.estadisticas?.proximas_citas || 0}
                      </p>
                      <p className="text-xs text-blue-700">
                        Próximas citas
                      </p>
                    </div>

                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">
                        {patient.estadisticas?.citas_completadas || 0}
                      </p>
                      <p className="text-xs text-green-700">
                        Completadas
                      </p>
                    </div>

                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                      <p className="text-2xl font-bold text-red-700">
                        {patient.estadisticas?.inasistencias || 0}
                      </p>
                      <p className="text-xs text-red-700">
                        Inasistencias
                      </p>
                    </div>

                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-center">
                      <p className="text-2xl font-bold text-orange-700">
                        {patient.estadisticas?.canceladas || 0}
                      </p>
                      <p className="text-xs text-orange-700">
                        Canceladas
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#A8CF45] bg-[#A8CF45]/10 p-3 text-center">
                      <p className="text-2xl font-bold text-[#2C3E34]">
                        {patient.estadisticas?.porcentaje_asistencia || 0}%
                      </p>
                      <p className="text-xs text-[#6E7C72]">
                        Asistencia
                      </p>
                    </div>
                  </div>
                </div>
              {/* Próxima cita */}
              {patient.proxima_cita && (
                <div>
                  <h3 className="text-lg font-semibold text-[#6B8E7B] mb-3">Próxima Cita</h3>
                  <div className="bg-[#FAF9F7] p-3 rounded-lg">
                    <div><span className="font-semibold">Fecha:</span> {new Date(patient.proxima_cita.appointment_date).toLocaleDateString('es-ES')}</div>
                    <div><span className="font-semibold">Hora:</span> {patient.proxima_cita.start_time.slice(0,5)} - {patient.proxima_cita.end_time.slice(0,5)}</div>
                    <div><span className="font-semibold">Anticipo:</span> {patient.proxima_cita.deposit_paid ? `Pagado ($${patient.proxima_cita.deposit_amount})` : `Pendiente ($${patient.proxima_cita.deposit_amount})`}</div>
                  </div>
                </div>
              )}

              {/* Historial de citas */}
                {patient.historial_citas &&
                  patient.historial_citas.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-[#6B8E7B]">
                        Historial de Citas
                      </h3>

                      <div className="max-h-60 space-y-2 overflow-y-auto pr-2">
                        {patient.historial_citas.map((cita: any) => {
                          const statusConfig: Record<
                            string,
                            {
                              label: string;
                              className: string;
                            }
                          > = {
                            scheduled: {
                              label: "Programada",
                              className:
                                "border-[#5A8C7A]/30 bg-[#5A8C7A]/15 text-[#2C3E34]",
                            },
                            confirmed: {
                              label: "Confirmada",
                              className:
                                "border-blue-200 bg-blue-50 text-blue-700",
                            },
                            completed: {
                              label: "Completada",
                              className:
                                "border-green-200 bg-green-50 text-green-700",
                            },
                            no_show: {
                              label: "No asistió",
                              className:
                                "border-red-200 bg-red-50 text-red-700",
                            },
                            cancelled: {
                              label: "Cancelada",
                              className:
                                "border-orange-200 bg-orange-50 text-orange-700",
                            },
                          };

                          const status =
                            statusConfig[cita.status] || {
                              label: cita.status || "Sin estado",
                              className:
                                "border-gray-200 bg-gray-50 text-gray-700",
                            };

                          /*
                          * Se formatea la fecha manualmente para evitar
                          * que JavaScript cambie el día por la zona horaria.
                          */
                          const appointmentDate = new Date(
                                cita.appointment_date,
                              );

                            const formattedDate = Number.isNaN(
                              appointmentDate.getTime(),
                            )
                              ? "Fecha no disponible"
                              : new Intl.DateTimeFormat("es-MX", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  timeZone: "UTC",
                                }).format(appointmentDate);

                          return (
                            <div
                              key={cita.id}
                              className={`rounded-lg border p-3 ${
                                cita.status === "no_show"
                                  ? "border-red-200 bg-red-50/40"
                                  : cita.status === "completed"
                                    ? "border-green-200 bg-green-50/30"
                                    : "border-[#E6E3DE] bg-[#FAF9F7]"
                              }`}
                            >
                              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                <div>
                                  <div className="font-medium text-[#2C3E34]">
                                    {formattedDate}
                                  </div>

                                  <div className="mt-1 text-sm text-[#6E7C72]">
                                    {cita.start_time?.slice(0, 5)} -{" "}
                                    {cita.end_time?.slice(0, 5)}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Estado de la cita */}
                                  <span
                                    className={`rounded-full border px-2 py-1 text-xs font-semibold ${status.className}`}
                                  >
                                    {status.label}
                                  </span>

                                  {/* Estado del anticipo */}
                                  <span
                                    className={`rounded-full px-2 py-1 text-xs ${
                                      cita.deposit_paid
                                        ? "bg-[#A8CF45]/20 text-[#2C3E34]"
                                        : "bg-[#F58634]/20 text-[#2C3E34]"
                                    }`}
                                  >
                                    {cita.deposit_paid
                                      ? `Pagado ($${Number(
                                          cita.deposit_amount || 0,
                                        ).toFixed(2)})`
                                      : `Pendiente ($${Number(
                                          cita.deposit_amount || 0,
                                        ).toFixed(2)})`}
                                  </span>
                                </div>
                              </div>

                              {cita.notes && (
                                <div className="mt-2 border-t border-[#E6E3DE] pt-2 text-sm text-[#6E7C72]">
                                  <span className="font-medium text-[#2C3E34]">
                                    Notas:
                                  </span>{" "}
                                  {cita.notes}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
            </div>
          ) : (
            // Modo edición - formulario
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Nombre *</label>
                  <input type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Segundo nombre</label>
                  <input type="text" value={formData.second_name} onChange={(e) => setFormData({...formData, second_name: e.target.value})} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Apellido paterno *</label>
                  <input type="text" value={formData.first_lastname} onChange={(e) => setFormData({...formData, first_lastname: e.target.value})} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Apellido materno</label>
                  <input type="text" value={formData.second_lastname} onChange={(e) => setFormData({...formData, second_lastname: e.target.value})} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Edad *</label>
                  <input type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Género</label>
                  <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg">
                    <option value="">No especificado</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Fecha de nacimiento</label>
                  <input type="date" value={formData.fecha_nacimiento} onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Estado civil</label>
                  <select value={formData.estado_civil} onChange={(e) => setFormData({...formData, estado_civil: e.target.value})} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg">
                    {estadoCivilOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Ocupación</label>
                  <input type="text" value={formData.ocupacion} onChange={(e) => setFormData({...formData, ocupacion: e.target.value})} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Teléfono</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Correo electrónico *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Nombre de usuario *</label>
                  <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Notas</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E6E3DE]">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-[#E6E3DE] rounded-lg text-[#6E7C72] hover:bg-[#FAF9F7]">Cancelar</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] disabled:opacity-50">
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}