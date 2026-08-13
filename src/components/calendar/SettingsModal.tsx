'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DisableHoursModal from './DisableHourModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  type: 'general' | 'day';
  selectedDate?: Date | null;
  initialSettings?: any;
}

export default function SettingsModal({ isOpen, onClose, onSave, type, selectedDate, initialSettings }: SettingsModalProps) {
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [lunchStart, setLunchStart] = useState('12:00');
  const [lunchEnd, setLunchEnd] = useState('13:00');
  const [depositAmount, setDepositAmount] = useState(100);
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  const [disabledHours, setDisabledHours] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dayAppointments, setDayAppointments] = useState<any[]>([]);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [pendingHoursToDisable, setPendingHoursToDisable] = useState<string[]>([]);

  useEffect(() => {
    if (initialSettings && isOpen) {
      setStartTime(initialSettings.start_time?.slice(0, 5) || '08:00');
      setEndTime(initialSettings.end_time?.slice(0, 5) || '18:00');
      setLunchStart(initialSettings.lunch_start?.slice(0, 5) || '12:00');
      setLunchEnd(initialSettings.lunch_end?.slice(0, 5) || '13:00');
      setDepositAmount(initialSettings.deposit_amount || 100);
      setIsWorkingDay(initialSettings.is_working_day !== false);
      
      let disabledHoursArray = initialSettings.disabled_hours || [];
      if (typeof disabledHoursArray === 'string') {
        try {
          disabledHoursArray = JSON.parse(disabledHoursArray);
        } catch (e) {
          disabledHoursArray = [];
        }
      }
      if (!Array.isArray(disabledHoursArray)) {
        disabledHoursArray = [];
      }
      setDisabledHours(disabledHoursArray);
    }
  }, [initialSettings, isOpen]);

  useEffect(() => {
    if (type === 'day' && selectedDate && isOpen) {
      loadDayAppointments();
    }
  }, [selectedDate, type, isOpen]);

  const loadDayAppointments = async () => {
    try {
      const { getAppointmentsByDay } = await import('@/lib/appointments-actions');
      const appointments = await getAppointmentsByDay(selectedDate!);
      setDayAppointments(appointments);
    } catch (error) {
      console.error('Error al cargar citas del día:', error);
    }
  };

  // Función para generar horas basadas en startTime, endTime, lunchStart, lunchEnd
  const generateHours = () => {
    const hours: string[] = [];
    
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    
    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);
    const lunchStartMin = toMinutes(lunchStart);
    const lunchEndMin = toMinutes(lunchEnd);
    const slotDuration = 30; // 30 minutos por slot
    
    for (let t = startMin; t < endMin; t += slotDuration) {
      // Saltar horario de comida
      if (t >= lunchStartMin && t < lunchEndMin) continue;
      
      const hour = Math.floor(t / 60);
      const minute = t % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      hours.push(timeStr);
    }
    
    return hours;
  };

  const toggleDisabledHour = (hour: string) => {
    const appointment = dayAppointments.find(app => 
      app.start_time.slice(0, 5) === hour
    );

    const currentDisabledHours = Array.isArray(disabledHours) ? disabledHours : [];
    
    if (appointment && !currentDisabledHours.includes(hour)) {
      setPendingHoursToDisable([hour]);
      setShowDisableModal(true);
      return;
    }
    
    if (currentDisabledHours.includes(hour)) {
      setDisabledHours(currentDisabledHours.filter(h => h !== hour));
    } else {
      setDisabledHours([...currentDisabledHours, hour]);
    }
  };

  const handleDisableMultipleHours = (hours: string[]) => {
    setPendingHoursToDisable(hours);
    setShowDisableModal(true);
  };

  const confirmDisableHours = () => {
    const currentDisabledHours = Array.isArray(disabledHours) ? disabledHours : [];
    setDisabledHours([...new Set([...currentDisabledHours, ...pendingHoursToDisable])]);
    setShowDisableModal(false);
    setPendingHoursToDisable([]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { saveGeneralSettings, saveDayException } = await import('@/lib/appointments-actions');
      
      if (type === 'general') {
        await saveGeneralSettings({ startTime, endTime, lunchStart, lunchEnd, depositAmount });
        toast.success('Configuración general guardada');
      } else {
        await saveDayException({
          date: selectedDate!,
          startTime,
          endTime,
          lunchStart,
          lunchEnd,
          isWorkingDay,
          disabledHours: Array.isArray(disabledHours) ? disabledHours : []
        });
        toast.success('Configuración del día guardada');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Generar horas dinámicamente basadas en los valores actuales
  const hours = generateHours();

  const hasAppointment = (hour: string) => {
    return dayAppointments.some(app => app.start_time.slice(0, 5) === hour);
  };

  const getAppointmentForHour = (hour: string) => {
    return dayAppointments.find(app => app.start_time.slice(0, 5) === hour);
  };

  // Verificar si un horario está dentro del rango de comida
  const isLunchHour = (hour: string) => {
    const lunchStartMin = parseInt(lunchStart.split(':')[0]) * 60 + parseInt(lunchStart.split(':')[1]);
    const lunchEndMin = parseInt(lunchEnd.split(':')[0]) * 60 + parseInt(lunchEnd.split(':')[1]);
    const hourMin = parseInt(hour.split(':')[0]) * 60 + parseInt(hour.split(':')[1]);
    return hourMin >= lunchStartMin && hourMin < lunchEndMin;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#E6E3DE]">
          <div className="sticky top-0 bg-white border-b border-[#E6E3DE] px-6 py-4 bg-[#FAF9F7] flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#6B8E7B]">
              {type === 'general' ? 'Configuración General' : `Configuración del día ${selectedDate?.toLocaleDateString('es-ES')}`}
            </h2>
            <button onClick={onClose} className="text-[#6E7C72] hover:text-[#2C3E34]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-4">
            {type === 'day' && (
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={isWorkingDay} onChange={(e) => setIsWorkingDay(e.target.checked)} className="rounded text-[#6B8E7B]" />
                <span className="text-sm text-[#2C3E34]">Día laborable</span>
              </label>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Hora de inicio</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Hora de fin</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Inicio comida</label>
                <input type="time" value={lunchStart} onChange={(e) => setLunchStart(e.target.value)} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Fin comida</label>
                <input type="time" value={lunchEnd} onChange={(e) => setLunchEnd(e.target.value)} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" />
              </div>
            </div>

            {type === 'general' && (
              <div>
                <label className="block text-sm font-semibold text-[#2C3E34] mb-1">Monto de anticipo ($)</label>
                <input type="number" step="10" value={depositAmount} onChange={(e) => setDepositAmount(parseFloat(e.target.value))} className="w-full px-3 py-2 border border-[#E6E3DE] rounded-lg" />
              </div>
            )}

            {type === 'day' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-[#2C3E34]">Horas deshabilitadas</label>
                  {dayAppointments.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const hoursWithAppointments = dayAppointments.map(app => app.start_time.slice(0, 5));
                        handleDisableMultipleHours(hoursWithAppointments);
                      }}
                      className="text-xs text-[#F58634] hover:text-[#BD7D4A]"
                    >
                      Inhabilitar todas con cita
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto p-2 border border-[#E6E3DE] rounded-lg">
                  {hours.map(hour => {
                    const hasApp = hasAppointment(hour);
                    const isDisabled = Array.isArray(disabledHours) && disabledHours.includes(hour);
                    const appointment = getAppointmentForHour(hour);
                    const isLunch = isLunchHour(hour);
                    
                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => toggleDisabledHour(hour)}
                        disabled={isLunch}
                        className={`py-1 px-2 text-xs rounded relative ${
                          isLunch
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isDisabled 
                              ? 'bg-red-500 text-white' 
                              : hasApp 
                                ? 'bg-[#F58634]/30 text-[#2C3E34] border border-[#F58634]'
                                : 'bg-[#E6E3DE] text-[#2C3E34] hover:bg-[#6B8E7B]/20'
                        }`}
                        title={isLunch ? 'Horario de comida' : (hasApp ? `Cita: ${appointment?.nombre_completo}` : '')}
                      >
                        {hour}
                        {hasApp && !isDisabled && !isLunch && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#F58634] rounded-full"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-s text-[#6E7C72] mt-2">
                   Los horarios en gris (horario de comida) no están disponibles para agendar citas.
                </p>
                {dayAppointments.length > 0 && (
                  <p className="text-s text-[#6E7C72] mt-1">
                    Los horarios marcados con punto naranja tienen citas registradas.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E6E3DE]">
              <button onClick={onClose} className="px-4 py-2 border border-[#E6E3DE] rounded-lg text-[#6E7C72] hover:bg-[#FAF9F7]">Cancelar</button>
              <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] disabled:opacity-50">
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <DisableHoursModal
        isOpen={showDisableModal}
        onClose={() => {
          setShowDisableModal(false);
          setPendingHoursToDisable([]);
        }}
        onConfirm={confirmDisableHours}
        appointments={dayAppointments.filter(app => 
          pendingHoursToDisable.includes(app.start_time.slice(0, 5))
        )}
        date={selectedDate!}
        hoursToDisable={pendingHoursToDisable}
      />
    </>
  );
}