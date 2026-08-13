'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import TimeSlotPicker from './TimeSlotPicker';

interface Appointment {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  deposit_paid: boolean;
  deposit_amount: number;
  notes?: string;
}

interface PatientAppointmentActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointment: Appointment | null;
  patientId: number;
}

type ActionType = 'cancel' | 'reschedule' | null;

export default function PatientAppointmentActionsModal({
  isOpen,
  onClose,
  onSuccess,
  appointment,
  patientId
}: PatientAppointmentActionsModalProps) {
  const [action, setAction] = useState<ActionType>(null);
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleCancel = async () => {
    setLoading(true);
    try {
      const { cancelAppointment } = await import('@/lib/patient-appointments-actions');
      await cancelAppointment(appointment.id, patientId);
      toast.success('Cita cancelada exitosamente');
      onSuccess();
      onClose();
      setAction(null);
    } catch (error) {
      toast.error('Error al cancelar la cita');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      toast.error('Selecciona una nueva fecha y horario');
      return;
    }

    setLoading(true);
    try {
      const { rescheduleAppointment } = await import('@/lib/patient-appointments-actions');
      await rescheduleAppointment(appointment.id, patientId, new Date(newDate), newTime + ':00');
      toast.success('Cita reagendada exitosamente');
      onSuccess();
      onClose();
      setAction(null);
      setNewDate('');
      setNewTime(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al reagendar la cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-[#E6E3DE]">
        <div className="p-6">
          <h3 className="text-lg font-bold text-[#6B8E7B] mb-4">
            {action === 'cancel' ? 'Cancelar cita' : action === 'reschedule' ? 'Reagendar cita' : 'Opciones de cita'}
          </h3>

          {!action ? (
            <>
              <div className="mb-4 p-3 bg-[#FAF9F7] rounded-lg">
                <p className="text-sm text-[#2C3E34]">
                  <strong>Fecha:</strong> {new Date(appointment.appointment_date).toLocaleDateString('es-ES')}
                </p>
                <p className="text-sm text-[#2C3E34] mt-1">
                  <strong>Hora:</strong> {appointment.start_time.slice(0, 5)}
                </p>
                <p className="text-sm text-[#2C3E34] mt-1">
                  <strong>Anticipo:</strong> {appointment.deposit_paid ? `Pagado ($${appointment.deposit_amount})` : `Pendiente ($${appointment.deposit_amount})`}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setAction('reschedule')}
                  className="w-full py-2 bg-[#6B8E7B] text-white rounded-lg hover:bg-[#4A7C6A]"
                >
                  Reagendar cita
                </button>
                <button
                  onClick={() => setAction('cancel')}
                  className="w-full py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
                >
                  Cancelar cita
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2 border border-[#E6E3DE] text-[#6E7C72] rounded-lg hover:bg-[#FAF9F7]"
                >
                  Volver
                </button>
              </div>
            </>
          ) : action === 'cancel' ? (
            <>
              <div className="bg-red-50 p-3 rounded-lg mb-4 border-l-4 border-red-500">
                <p className="text-sm text-red-700">
                  ¿Estás seguro de que deseas cancelar esta cita?
                  {appointment.deposit_paid && (
                    <span className="block mt-2 font-semibold">
                      Nota: El anticipo de ${appointment.deposit_amount} no es reembolsable.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setAction(null)}
                  className="px-4 py-2 border border-[#E6E3DE] rounded-lg text-[#6E7C72] hover:bg-[#FAF9F7]"
                >
                  Volver
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {loading ? 'Cancelando...' : 'Sí, cancelar cita'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-[#2C3E34] mb-2">
                  Nueva fecha
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg"
                />
              </div>

              {newDate && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-[#2C3E34] mb-2">
                    Nuevo horario
                  </label>
                  <TimeSlotPicker
                    date={new Date(newDate)}
                    patientId={patientId}
                    onSelectSlot={setNewTime}
                    selectedTime={newTime}
                  />
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setAction(null)}
                  className="px-4 py-2 border border-[#E6E3DE] rounded-lg text-[#6E7C72] hover:bg-[#FAF9F7]"
                >
                  Volver
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={loading || !newDate || !newTime}
                  className="px-4 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] disabled:opacity-50"
                >
                  {loading ? 'Reagendando...' : 'Confirmar reagendado'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}