'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCalendarSettings, getExceptions, getAppointmentsByDateRange, getTodayAppointments, getPendingAppointmentsCount } from '@/lib/appointments-actions';
import AppointmentModal from '@/components/calendar/AppointmentModal';
import SettingsModal from '@/components/calendar/SettingsModal';
import DayAppointmentsList from '@/components/calendar/DayAppointmentsList';
import { toast } from 'react-hot-toast';

export const dynamic = 'force-dynamic';

interface DayInfo {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  appointmentsCount: number;
  isException?: boolean;
  isWorkingDay?: boolean;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<DayInfo[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [depositAmount, setDepositAmount] = useState(100);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsType, setSettingsType] = useState<'general' | 'day'>('general');
  const [currentSettings, setCurrentSettings] = useState<any>(null);
  const [exceptionsMap, setExceptionsMap] = useState<Map<string, any>>(new Map());

  const changeMonth = (increment: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + increment);
    setCurrentDate(newDate);
  };

  const loadMonthData = useCallback(async () => {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    try {
      // Obtener configuración general
      const settings = await getCalendarSettings();
      setDepositAmount(settings.deposit_amount);

      // Obtener citas pendientes
      const pending = await getPendingAppointmentsCount();
      setPendingAppointments(pending);

      // Obtener citas y excepciones del mes
      const [appointments, exceptions] = await Promise.all([
        getAppointmentsByDateRange(startDate, endDate),
        getExceptions(startDate, endDate)
      ]);

      const appointmentsMap = new Map();
      appointments.forEach((app: any) => {
        appointmentsMap.set(app.appointment_date.toISOString().split('T')[0], app.total);
      });

      const exceptionsMapTemp = new Map();
      exceptions.forEach((ex: any) => {
        exceptionsMapTemp.set(ex.exception_date.toISOString().split('T')[0], ex);
      });
      setExceptionsMap(exceptionsMapTemp);

      const days: DayInfo[] = [];
      let current = new Date(startDate);
      while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0];
        const count = appointmentsMap.get(dateStr) || 0;
        const exception = exceptionsMapTemp.get(dateStr);
        days.push({
          date: new Date(current),
          dayOfMonth: current.getDate(),
          isCurrentMonth: current.getMonth() === month,
          appointmentsCount: count,
          isException: !!exception,
          isWorkingDay: exception ? exception.is_working_day : true
        });
        current.setDate(current.getDate() + 1);
      }
      setCalendarDays(days);

      const weekly = await import('@/lib/appointments-actions').then(m => m.getWeeklyAppointmentsCount(currentDate));
      setWeeklyCount(weekly);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayApps = await getTodayAppointments();
      console.log('Citas de hoy encontradas:', todayApps.length);
      setTodayCount(todayApps.length);
    } catch (error) {
      console.error('Error al cargar datos del mes:', error);
      toast.error('Error al cargar los datos del calendario');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadMonthData();
  }, [loadMonthData]);

  const handleDayClick = (day: DayInfo) => {
    setSelectedDay(day.date);
  };

  const openSettings = async (type: 'general' | 'day', date?: Date) => {
    if (type === 'general') {
      const settings = await getCalendarSettings();
      setCurrentSettings(settings);
    } else if (date) {
      const exception = exceptionsMap.get(date.toISOString().split('T')[0]);
      const settings = await getCalendarSettings();
      setCurrentSettings({
        start_time: exception?.start_time || settings.start_time,
        end_time: exception?.end_time || settings.end_time,
        lunch_start: exception?.lunch_start || settings.lunch_start,
        lunch_end: exception?.lunch_end || settings.lunch_end,
        deposit_amount: settings.deposit_amount,
        is_working_day: exception?.is_working_day !== false,
        disabled_hours: exception?.disabled_hours || []
      });
    }
    setSettingsType(type);
    setSettingsModalOpen(true);
  };

  const getDayColorClass = (day: DayInfo) => {
    if (!day.isWorkingDay) return 'bg-gray-700 border-gray-800 text-white';
    if (day.date.getDay() === 0) return 'bg-gray-400 border-gray-500 text-white';
    if (day.appointmentsCount === 0) return 'bg-[#FAF9F7] border-[#E6E3DE]';
    if (day.appointmentsCount <= 3) return 'bg-[#A8CF45]/20 border-[#A8CF45]';
    if (day.appointmentsCount <= 6) return 'bg-[#BD7D4A]/20 border-[#BD7D4A]';
    if (day.appointmentsCount <= 10) return 'bg-[#F58634]/20 border-[#F58634]';
    return 'bg-red-100 border-red-300';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F7] p-6 flex items-center justify-center">
        <div className="text-[#6E7C72]">Cargando calendario...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado con botón de configuración general */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#5A8C7A]">Calendario de Citas</h1>
          <button
            onClick={() => openSettings('general')}
            className="px-4 py-2 bg-[#5A8C7A] text-white rounded-lg hover:bg-[#4A7C6A] flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configuración
          </button>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#5A8C7A]">
            <p className="text-[#6E7C72] text-sm">Citas esta semana</p>
            <p className="text-2xl font-bold text-[#2C3E34]">{weeklyCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#BD7D4A]">
            <p className="text-[#6E7C72] text-sm">Citas hoy</p>
            <p className="text-2xl font-bold text-[#2C3E34]">{todayCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#A8CF45]">
            <p className="text-[#6E7C72] text-sm">Anticipo actual</p>
            <p className="text-2xl font-bold text-[#2C3E34]">${depositAmount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#F58634]">
            <p className="text-[#6E7C72] text-sm">Citas pendientes</p>
            <p className="text-2xl font-bold text-[#2C3E34]">{pendingAppointments}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendario */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#5A8C7A]">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
              <div className="flex gap-2">
                <button onClick={() => changeMonth(-1)} className="px-3 py-1 border border-[#E6E3DE] rounded-lg hover:bg-[#FAF9F7]">←</button>
                <button onClick={() => changeMonth(1)} className="px-3 py-1 border border-[#E6E3DE] rounded-lg hover:bg-[#FAF9F7]">→</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-[#6E7C72] py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={`p-3 rounded-xl border-2 transition-all text-center min-h-20 ${getDayColorClass(day)} ${
                    day.isCurrentMonth ? '' : 'opacity-50'
                  } ${selectedDay?.toDateString() === day.date.toDateString() ? 'ring-2 ring-[#5A8C7A] ring-offset-2' : ''} ${
                    isToday(day.date) ? 'ring-2 ring-[#F58634] ring-offset-2' : ''
                  }`}
                >
                  <div className={`font-bold ${!day.isWorkingDay ? 'text-white' : day.date.getDay() === 0 ? 'text-white' : 'text-[#2C3E34]'}`}>
                    {day.dayOfMonth}
                  </div>
                  {day.isWorkingDay !== false && day.date.getDay() !== 0 && (
                    <div className={`text-xs mt-1 ${day.date.getDay() === 0 ? 'text-white' : 'text-[#6E7C72]'}`}>
                      {day.appointmentsCount} {day.appointmentsCount === 1 ? 'cita' : 'citas'}
                    </div>
                  )}
                  {day.isWorkingDay === false && (
                    <div className="text-xs mt-1 text-white">No laborable</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Panel lateral - usa variante sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-6 sticky top-4">
              {selectedDay ? (
                <>
                  <h3 className="text-lg font-bold text-[#5A8C7A] mb-2">
                    {selectedDay.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <div className="bg-[#FAF9F7] rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-[#6E7C72]">Citas agendadas:</span>
                      <span className="font-bold text-[#2C3E34]">{calendarDays.find(d => d.date.toDateString() === selectedDay.toDateString())?.appointmentsCount || 0}</span>
                    </div>
                    <button
                      onClick={() => setModalOpen(true)}
                      className="w-full py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] transition-colors text-sm font-semibold mb-2"
                    >
                      Agendar nueva cita
                    </button>
                    <button
                      onClick={() => openSettings('day', selectedDay)}
                      className="w-full py-2 border border-[#5A8C7A] text-[#5A8C7A] rounded-lg hover:bg-[#5A8C7A]/10 transition-colors text-sm font-semibold"
                    >
                      Configurar día
                    </button>
                  </div>
                  <DayAppointmentsList date={selectedDay} onRefresh={loadMonthData} variant="sidebar" />
                </>
              ) : (
                <div className="text-center py-8 text-[#6E7C72]">
                  <p>Selecciona un día para ver las citas</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de citas de hoy (abajo del calendario) - usa variante full */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-[#5A8C7A] mb-4">Citas de Hoy</h2>
          <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-4">
            <DayAppointmentsList date={new Date()} onRefresh={loadMonthData} variant="full" />
          </div>
        </div>
      </div>

      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={selectedDay}
        onSuccess={() => {
          loadMonthData();
          setModalOpen(false);
        }}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onSave={loadMonthData}
        type={settingsType}
        selectedDate={settingsType === 'day' ? selectedDay : null}
        initialSettings={currentSettings}
      />
    </div>
  );
}