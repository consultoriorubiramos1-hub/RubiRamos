'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditoriaClientProps {
  auditoriaInicial: any[];
  total: number;
}

export default function AuditoriaClient({ auditoriaInicial, total }: AuditoriaClientProps) {
  const [auditoria] = useState(auditoriaInicial);

  const getAccionColor = (accion: string) => {
    switch (accion) {
      case 'INSERT':
        return 'bg-[#A8CF45]/20 text-[#2C3E34] border-l-4 border-[#A8CF45]';
      case 'UPDATE':
        return 'bg-[#6B8E7B]/10 text-[#2C3E34] border-l-4 border-[#6B8E7B]';
      case 'DELETE':
        return 'bg-[#F58634]/10 text-[#2C3E34] border-l-4 border-[#F58634]';
      default:
        return 'bg-[#E6E3DE] text-[#6E7C72] border-l-4 border-[#6E7C72]';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#E6E3DE]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E6E3DE]">
          <thead className="bg-[#FAF9F7]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">
                Acción
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">
                Tabla
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">
                Detalles
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E6E3DE]">
            {auditoria.map((registro) => (
              <tr key={registro.id} className="hover:bg-[#FAF9F7] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6E7C72]">
                  {format(new Date(registro.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-[#2C3E34]">
                    {registro.usuario}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getAccionColor(registro.accion)}`}>
                    {registro.accion}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-mono text-[#6B8E7B]">
                    {registro.tabla_afectada}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <details className="cursor-pointer">
                    <summary className="text-[#BD7D4A] hover:text-[#F58634] font-semibold transition-colors">
                      Ver detalles
                    </summary>
                    <div className="mt-3 space-y-3">
                      {registro.datos_anteriores && (
                        <div className="bg-[#FAF9F7] rounded-lg p-3 border border-[#E6E3DE]">
                          <strong className="text-xs text-[#6B8E7B] block mb-2">Datos anteriores:</strong>
                          <pre className="text-xs bg-white p-2 rounded border border-[#E6E3DE] overflow-x-auto font-mono text-[#2C3E34]">
                            {JSON.stringify(registro.datos_anteriores, null, 2)}
                          </pre>
                        </div>
                      )}
                      {registro.datos_nuevos && (
                        <div className="bg-[#FAF9F7] rounded-lg p-3 border border-[#E6E3DE]">
                          <strong className="text-xs text-[#6B8E7B] block mb-2">Datos nuevos:</strong>
                          <pre className="text-xs bg-white p-2 rounded border border-[#E6E3DE] overflow-x-auto font-mono text-[#2C3E34]">
                            {JSON.stringify(registro.datos_nuevos, null, 2)}
                          </pre>
                        </div>
                      )}
                      {registro.query_text && (
                        <div className="bg-[#2C3E34] rounded-lg p-3">
                          <strong className="text-xs text-[#A8CF45] block mb-2">Query ejecutado:</strong>
                          <pre className="text-xs text-[#A8CF45] overflow-x-auto font-mono">
                            {registro.query_text}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 50 && (
        <div className="px-6 py-4 border-t border-[#E6E3DE] text-center text-sm text-[#6E7C72] bg-[#FAF9F7]">
          Mostrando los últimos 50 registros. Total: {total} registros
        </div>
      )}
    </div>
  );
}