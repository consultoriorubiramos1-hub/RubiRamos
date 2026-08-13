'use client';

import { useState, useEffect } from 'react';
import { searchPatients, createPatientAndUser, checkUsernameExists } from '@/lib/patients-actions';
import { createAppointment, getAvailableSlots, getCalendarSettings } from '@/lib/appointments-actions';
import ConfirmationModal from './ConfirmationModal';
import { toast } from 'react-hot-toast';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onSuccess: () => void;
}

export default function AppointmentModal({ isOpen, onClose, selectedDate, onSuccess }: AppointmentModalProps) {
  const [step, setStep] = useState<'select-patient' | 'new-patient'>('select-patient');
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [depositPaid, setDepositPaid] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Formulario nuevo paciente
  const [newPatient, setNewPatient] = useState({
    username: '',
    email: '',
    first_name: '',
    second_name: '',
    first_lastname: '',
    second_lastname: '',
    age: '',
    gender: '',
    phone: '',
    notes: '',
    fecha_nacimiento: '',
    estado_civil: '',
    ocupacion: ''
  });

  useEffect(() => {
    if (isOpen && selectedDate) {
      loadAvailableSlots();
      loadDepositAmount();
      loadPatientsList();
      setSelectedPatient(null);
      setSelectedTime('');
      setDepositPaid(false);
      setNotes('');
      setStep('select-patient');
      setSearchTerm('');
      setUsernameError('');
    }
  }, [isOpen, selectedDate]);

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;
    const slots = await getAvailableSlots(selectedDate);
    setAvailableSlots(slots);
    if (slots.length > 0) setSelectedTime(slots[0]);
  };

  const loadDepositAmount = async () => {
    const settings = await getCalendarSettings();
    setDepositAmount(settings.deposit_amount);
  };

  const loadPatientsList = async () => {
    const result = await searchPatients('');
    const patientsArray = Array.isArray(result) ? result : (result as any)?.patients || [];
    setPatients(patientsArray);
  };

  const handleSearchPatients = async () => {
    const result = await searchPatients(searchTerm);
    const patientsArray = Array.isArray(result) ? result : (result as any)?.patients || [];
    setPatients(patientsArray);
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
  };

  const handleUsernameBlur = async () => {
    if (newPatient.username) {
      const exists = await checkUsernameExists(newPatient.username);
      if (exists) {
        setUsernameError('Este nombre de usuario ya existe');
      } else {
        setUsernameError('');
      }
    }
  };

  const handleCreatePatient = async () => {
    if (!newPatient.first_name || !newPatient.first_lastname || !newPatient.age || !newPatient.email) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }
    if (!newPatient.username) {
      toast.error('El nombre de usuario es obligatorio');
      return;
    }
    if (usernameError) {
      toast.error('Corrige el error del nombre de usuario antes de continuar');
      return;
    }
    
    setLoading(true);
    try {
      const result = await createPatientAndUser({
        username: newPatient.username,
        email: newPatient.email,
        first_name: newPatient.first_name,
        second_name: newPatient.second_name || null,
        first_lastname: newPatient.first_lastname,
        second_lastname: newPatient.second_lastname || null,
        age: parseInt(newPatient.age),
        gender: newPatient.gender || null,
        phone: newPatient.phone || null,
        notes: newPatient.notes || null,
        fecha_nacimiento: newPatient.fecha_nacimiento || null,
        estado_civil: newPatient.estado_civil || null,
        ocupacion: newPatient.ocupacion || null
      });
      if (result.success) {
        const newPatientData = {
          id: result.patientId,
          nombre_completo: `${newPatient.first_name} ${newPatient.second_name || ''} ${newPatient.first_lastname} ${newPatient.second_lastname || ''}`.trim().replace(/\s+/g, ' '),
          email: newPatient.email
        };
        setSelectedPatient(newPatientData);
        toast.success('Paciente creado exitosamente');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async () => {
    if (!selectedPatient || !selectedDate || !selectedTime) {
      toast.error('Selecciona un paciente y un horario');
      return;
    }
    
    setLoading(true);
    try {
      const [hour, minute] = selectedTime.split(':').map(Number);
      const endDate = new Date(selectedDate);
      endDate.setHours(hour, minute + 30, 0);
      const endTime = `${endDate.getHours().toString().padStart(2,'0')}:${endDate.getMinutes().toString().padStart(2,'0')}:00`;

      await createAppointment({
        patientId: selectedPatient.id,
        appointmentDate: selectedDate,
        startTime: selectedTime,
        endTime,
        depositPaid,
        depositAmount,
        notes,
      });
      toast.success('Cita agendada correctamente');
      setShowConfirmation(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al agendar cita');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#E6E3DE]">
          <div className="sticky top-0 bg-white border-b border-[#E6E3DE] px-6 py-4 bg-[#FAF9F7] flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#6B8E7B]">Nueva Cita</h2>
            <button onClick={onClose} className="text-[#6E7C72] hover:text-[#2C3E34]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-4">
            {!selectedPatient ? (
              <>
                <div className="flex gap-4 border-b border-[#E6E3DE] pb-2">
                  <button
                    onClick={() => setStep('select-patient')}
                    className={`pb-2 font-semibold ${step === 'select-patient' ? 'text-[#6B8E7B] border-b-2 border-[#6B8E7B]' : 'text-[#6E7C72]'}`}
                  >
                    Paciente existente
                  </button>
                  <button
                    onClick={() => setStep('new-patient')}
                    className={`pb-2 font-semibold ${step === 'new-patient' ? 'text-[#6B8E7B] border-b-2 border-[#6B8E7B]' : 'text-[#6E7C72]'}`}
                  >
                    Nuevo paciente
                  </button>
                </div>

                {step === 'select-patient' && (
                  <div>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nombre, apellido o email..."
                        className="flex-1 px-3 py-2 border border-[#E6E3DE] rounded-lg focus:ring-2 focus:ring-[#6B8E7B]"
                      />
                      <button onClick={handleSearchPatients} className="px-4 py-2 bg-[#6B8E7B] text-white rounded-lg hover:bg-[#4A7C6A]">Buscar</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 border border-[#E6E3DE] rounded-lg p-2">
                      {patients.map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => handleSelectPatient(patient)}
                          className="p-3 rounded-lg border cursor-pointer transition-colors hover:bg-[#FAF9F7] border-[#E6E3DE]"
                        >
                          <div className="font-medium text-[#2C3E34]">{patient.nombre_completo}</div>
                          <div className="text-sm text-[#6E7C72]">{patient.email}</div>
                        </div>
                      ))}
                      {patients.length === 0 && <p className="text-center text-[#6E7C72] py-4">No hay pacientes registrados</p>}
                    </div>
                  </div>
                )}

                {step === 'new-patient' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Nombre *" value={newPatient.first_name} onChange={(e) => setNewPatient({...newPatient, first_name: e.target.value})} className="px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                      <input type="text" placeholder="Segundo nombre" value={newPatient.second_name} onChange={(e) => setNewPatient({...newPatient, second_name: e.target.value})} className="px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                      <input type="text" placeholder="Apellido paterno *" value={newPatient.first_lastname} onChange={(e) => setNewPatient({...newPatient, first_lastname: e.target.value})} className="px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                      <input type="text" placeholder="Apellido materno" value={newPatient.second_lastname} onChange={(e) => setNewPatient({...newPatient, second_lastname: e.target.value})} className="px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                      <input type="number" placeholder="Edad *" value={newPatient.age} onChange={(e) => setNewPatient({...newPatient, age: e.target.value})} className="px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                      <select value={newPatient.gender} onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})} className="px-3 py-2 border border-[#E6E3DE] rounded-lg">
                        <option value="">Género</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                      </select>
                      <input type="date" placeholder="Fecha de nacimiento" value={newPatient.fecha_nacimiento} onChange={(e) => setNewPatient({...newPatient, fecha_nacimiento: e.target.value})} className="px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                      <select value={newPatient.estado_civil} onChange={(e) => setNewPatient({...newPatient, estado_civil: e.target.value})} className="px-3 py-2 border border-[#E6E3DE] rounded-lg">
                        {estadoCivilOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <input type="text" placeholder="Ocupación" value={newPatient.ocupacion} onChange={(e) => setNewPatient({...newPatient, ocupacion: e.target.value})} className="px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                      <input type="email" placeholder="Correo electrónico *" value={newPatient.email} onChange={(e) => setNewPatient({...newPatient, email: e.target.value})} className="col-span-2 px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                      <input type="text" placeholder="Nombre de usuario *" value={newPatient.username} onChange={(e) => setNewPatient({...newPatient, username: e.target.value})} onBlur={handleUsernameBlur} className={`col-span-2 px-3 py-2 border rounded-lg ${usernameError ? 'border-[#F58634]' : 'border-[#E6E3DE]'}`} />
                      {usernameError && <p className="text-sm text-[#F58634] -mt-2">{usernameError}</p>}
                      <input type="tel" placeholder="Teléfono" value={newPatient.phone} onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})} className="px-3 py-2 border border-[#E6E3DE] rounded-lg" />
                      <textarea placeholder="Notas" value={newPatient.notes} onChange={(e) => setNewPatient({...newPatient, notes: e.target.value})} className="col-span-2 px-3 py-2 border border-[#E6E3DE] rounded-lg" rows={2} />
                    </div>
                    <button onClick={handleCreatePatient} disabled={loading || !!usernameError} className="w-full py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] disabled:opacity-50">
                      {loading ? 'Creando...' : 'Registrar paciente y continuar'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div>
                <div className="bg-[#FAF9F7] p-3 rounded-lg border border-[#E6E3DE] mb-4">
                  <div className="font-medium text-[#2C3E34]">{selectedPatient.nombre_completo}</div>
                  <div className="text-sm text-[#6E7C72]">{selectedPatient.email}</div>
                  <button onClick={() => setSelectedPatient(null)} className="mt-2 text-xs text-[#F58634] hover:text-[#BD7D4A]">Cambiar paciente</button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-2">Horario disponible</label>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border border-[#E6E3DE] rounded-lg">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`py-1 px-2 text-sm rounded-lg border ${selectedTime === slot ? 'bg-[#6B8E7B] text-white border-[#6B8E7B]' : 'border-[#E6E3DE] hover:bg-[#FAF9F7]'}`}
                      >
                        {slot.slice(0,5)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={depositPaid} onChange={(e) => setDepositPaid(e.target.checked)} className="rounded text-[#6B8E7B]" />
                    <span className="text-sm text-[#2C3E34]">Pagó anticipo</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#2C3E34]">Monto:</span>
                    <input type="number" step="10" value={depositAmount} onChange={(e) => setDepositAmount(parseFloat(e.target.value))} className="w-24 px-2 py-1 border border-[#E6E3DE] rounded-lg text-sm" />
                  </div>
                </div>

                <textarea placeholder="Notas de la cita (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" rows={2} />

                <button onClick={() => setShowConfirmation(true)} disabled={loading || !selectedTime} className="w-full py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] disabled:opacity-50">
                  Continuar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmAppointment}
        patientName={selectedPatient?.nombre_completo || ''}
        date={selectedDate?.toLocaleDateString('es-ES') || ''}
        time={selectedTime.slice(0,5)}
        depositPaid={depositPaid}
        depositAmount={depositAmount}
      />
    </>
  );
}