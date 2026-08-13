'use client';

import { FaPhone, FaEnvelope } from 'react-icons/fa';

interface DisableHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  appointments: any[];
  date: Date;
  hoursToDisable: string[];
}

export default function DisableHoursModal({ isOpen, onClose, onConfirm, appointments, date, hoursToDisable }: DisableHoursModalProps) {
  if (!isOpen) return null;

  // Filtrar citas que están en los horarios a deshabilitar
  const affectedAppointments = appointments.filter(app => 
    hoursToDisable.includes(app.start_time.slice(0, 5) + ':00')
  );

  if (affectedAppointments.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-[#E6E3DE]">
        <div className="sticky top-0 bg-white border-b border-[#E6E3DE] px-6 py-4 bg-[#FAF9F7] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#F58634]">Atención: Citas afectadas</h2>
          <button onClick={onClose} className="text-[#6E7C72] hover:text-[#2C3E34]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-[#2C3E34] mb-4">
            Los siguientes horarios tienen citas registradas. Si los inhabilitas, deberás contactar a los pacientes para reprogramar:
          </p>
          
          <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
            {affectedAppointments.map(app => (
              <div key={app.id} className="bg-[#FAF9F7] rounded-lg p-4 border border-[#E6E3DE]">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-[#F58634]">{app.start_time.slice(0,5)} - {app.end_time.slice(0,5)}</div>
                    <div className="font-medium text-[#2C3E34] mt-1">{app.nombre_completo}</div>
                    <div className="text-sm text-[#6E7C72]">{app.email}</div>
                    {app.phone && <div className="text-sm text-[#6E7C72]">📞 {app.phone}</div>}
                  </div>
                  <div className="flex gap-2">
                    {app.phone && (
                      <a href={`tel:${app.phone}`} className="p-2 bg-[#6B8E7B] text-white rounded-lg hover:bg-[#4A7C6A]">
                        <FaPhone size={14} />
                      </a>
                    )}
                    {app.email && (
                      <a href={`mailto:${app.email}`} className="p-2 bg-[#6B8E7B] text-white rounded-lg hover:bg-[#4A7C6A]">
                        <FaEnvelope size={14} />
                      </a>
                    )}
                  </div>
                </div>
                {app.deposit_paid && (
                  <div className="mt-2 text-xs text-[#A8CF45]">✓ Anticipo pagado (${app.deposit_amount})</div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-[#F58634]/10 p-3 rounded-lg mb-4 border-l-4 border-[#F58634]">
            <p className="text-sm text-[#2C3E34]">
              Al inhabilitar estos horarios, las citas serán marcadas como "pendientes de reprogramación". 
              Por favor, contacta a los pacientes para reagendar sus citas.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-[#E6E3DE] rounded-lg text-[#6E7C72] hover:bg-[#FAF9F7]">
              Cancelar
            </button>
            <button onClick={onConfirm} className="px-4 py-2 bg-[#F58634] text-white rounded-lg hover:bg-[#BD7D4A]">
              Sí, inhabilitar horarios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}