'use client';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  patientName: string;
  date: string;
  time: string;
  depositPaid: boolean;
  depositAmount: number;
}

export default function ConfirmationModal({ isOpen, onClose, onConfirm, patientName, date, time, depositPaid, depositAmount }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-[#E6E3DE]">
        <div className="p-6">
          <h3 className="text-lg font-bold text-[#6B8E7B] mb-4">Confirmar cita</h3>
          <div className="space-y-3 mb-4">
            <p className="text-sm text-[#2C3E34]"><strong>Paciente:</strong> {patientName}</p>
            <p className="text-sm text-[#2C3E34]"><strong>Fecha:</strong> {date}</p>
            <p className="text-sm text-[#2C3E34]"><strong>Hora:</strong> {time}</p>
            <p className="text-sm text-[#2C3E34]"><strong>Anticipo:</strong> {depositPaid ? `Pagado ($${depositAmount})` : `Pendiente ($${depositAmount})`}</p>
          </div>
          <div className="bg-[#FAF9F7] p-3 rounded-lg mb-4 border-l-4 border-[#BD7D4A]">
            <p className="text-xs text-[#6E7C72]">Recuerde al paciente acudir a su cita con al menos 10 minutos de anticipación para no perder la cita ni su anticipo de ${depositAmount}.</p>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-[#E6E3DE] rounded-lg text-[#6E7C72] hover:bg-[#FAF9F7]">Cancelar</button>
            <button onClick={onConfirm} className="px-4 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634]">Confirmar cita</button>
          </div>
        </div>
      </div>
    </div>
  );
}