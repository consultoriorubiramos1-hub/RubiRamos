'use client';

import { useState, useEffect } from 'react';

interface TimeSlotPickerProps {
  date: Date;
  patientId: number;
  onSelectSlot: (time: string) => void;
  selectedTime?: string | null;
}

export default function TimeSlotPicker({ date, patientId, onSelectSlot, selectedTime }: TimeSlotPickerProps) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        const { getAvailableSlotsForPatient } = await import('@/lib/patient-appointments-actions');
        const slots = await getAvailableSlotsForPatient(date, patientId);
        setAvailableSlots(slots.map(slot => slot.slice(0, 5)));
      } catch (err) {
        setError('Error al cargar horarios disponibles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSlots();
  }, [date, patientId]);

  if (loading) {
    return <div className="text-center py-4 text-[#6E7C72]">Cargando horarios...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  if (availableSlots.length === 0) {
    return <div className="text-center py-4 text-[#6E7C72]">No hay horarios disponibles para este día</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2">
      {availableSlots.map(slot => (
        <button
          key={slot}
          onClick={() => onSelectSlot(slot)}
          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            selectedTime === slot
              ? 'bg-[#BD7D4A] text-white'
              : 'bg-[#FAF9F7] border border-[#E6E3DE] text-[#2C3E34] hover:bg-[#6B8E7B]/10'
          }`}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}