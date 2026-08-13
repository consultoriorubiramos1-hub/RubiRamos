'use client';

import { useState, useEffect } from 'react';

interface DayAppointmentsListProps {
  date: Date;
  onRefresh?: () => void;
  variant?: 'sidebar' | 'full';
}

export default function DayAppointmentsList({ date, onRefresh, variant = 'sidebar' }: DayAppointmentsListProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentTime = new Date();

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const { getAppointmentsByDay } = await import('@/lib/appointments-actions');
      const data = await getAppointmentsByDay(date);
      setAppointments(data);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [date]);

  const isCurrentAppointment = (startTime: string) => {
    const [hour, minute] = startTime.split(':').map(Number);
    const appTime = new Date(date);
    appTime.setHours(hour, minute, 0);
    const diffMinutes = Math.abs(appTime.getTime() - currentTime.getTime()) / 60000;
    return diffMinutes < 30 && date.toDateString() === currentTime.toDateString();
  };

  if (loading) return <div className="text-center py-4 text-[#6E7C72]">Cargando citas...</div>;

  if (variant === 'sidebar') {
    return (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {appointments.length === 0 ? (
          <p className="text-center text-[#6E7C72] py-4">No hay citas agendadas este día</p>
        ) : (
          appointments.map(app => (
            <div
              key={app.id}
              className={`p-4 rounded-lg border transition-all ${
                isCurrentAppointment(app.start_time) 
                  ? 'bg-[#6B8E7B]/10 border-[#6B8E7B] shadow-md' 
                  : 'bg-white border-[#E6E3DE]'
              }`}
            >
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-lg font-bold text-[#6B8E7B]">{app.start_time.slice(0,5)}</span>
                <span className="text-sm text-[#6E7C72]">-</span>
                <span className="text-sm text-[#6E7C72]">{app.end_time.slice(0,5)}</span>
                {isCurrentAppointment(app.start_time) && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-[#F58634] text-white">Ahora</span>
                )}
              </div>
              
              <div className="mb-2">
                <div className="font-semibold text-[#2C3E34] text-base">{app.nombre_completo}</div>
                <div className="text-sm text-[#6E7C72]">{app.email}</div>
                {app.phone && <div className="text-sm text-[#6E7C72]">📞 {app.phone}</div>}
              </div>
              
              <div className="mb-2">
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${app.deposit_paid ? 'bg-[#A8CF45]/20 text-[#2C3E34]' : 'bg-[#F58634]/20 text-[#2C3E34]'}`}>
                  {app.deposit_paid ? `✓ Anticipo pagado ($${app.deposit_amount})` : `⚠ Anticipo pendiente ($${app.deposit_amount})`}
                </span>
              </div>
              
              {app.notes && (
                <div className="mt-2 pt-2 border-t border-[#E6E3DE]">
                  <p className="text-xs text-[#6E7C72]">
                    <span className="font-semibold">Notas:</span> {app.notes}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  // Variante full para la lista de abajo
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {appointments.length === 0 ? (
        <div className="col-span-full text-center py-8 text-[#6E7C72]">No hay citas agendadas para hoy</div>
      ) : (
        appointments.map(app => (
          <div
            key={app.id}
            className={`p-4 rounded-lg border transition-all ${
              isCurrentAppointment(app.start_time) 
                ? 'bg-[#6B8E7B]/10 border-[#6B8E7B] shadow-md' 
                : 'bg-white border-[#E6E3DE] hover:shadow-md'
            }`}
          >
            {/* Cabecera con horario */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E6E3DE]">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-[#6B8E7B]">{app.start_time.slice(0,5)}</span>
                <span className="text-sm text-[#6E7C72]">-</span>
                <span className="text-sm text-[#6E7C72]">{app.end_time.slice(0,5)}</span>
              </div>
              {isCurrentAppointment(app.start_time) && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-[#F58634] text-white">Ahora</span>
              )}
            </div>
            
            {/* Información del paciente */}
            <div className="mb-3">
              <div className="font-semibold text-[#2C3E34] text-lg">{app.nombre_completo}</div>
              <div className="text-sm text-[#6E7C72] mt-1">{app.email}</div>
              {app.phone && <div className="text-sm text-[#6E7C72] mt-0.5">📞 {app.phone}</div>}
            </div>
            
            {/* Estado del anticipo y notas */}
            <div className="space-y-2">
              <div>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${app.deposit_paid ? 'bg-[#A8CF45]/20 text-[#2C3E34]' : 'bg-[#F58634]/20 text-[#2C3E34]'}`}>
                  {app.deposit_paid ? `✓ Anticipo pagado ($${app.deposit_amount})` : `⚠ Anticipo pendiente ($${app.deposit_amount})`}
                </span>
              </div>
              
              {app.notes && (
                <div className="pt-2 border-t border-[#E6E3DE]">
                  <p className="text-xs text-[#6E7C72]">
                    <span className="font-semibold">Notas:</span> {app.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}