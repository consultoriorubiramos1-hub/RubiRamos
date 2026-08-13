'use client';

import { useState, useEffect } from 'react';
import { obtenerMetricasBaseDatos, MetricasBaseDatos } from '@/lib/metricas-db';
import { toast } from 'react-hot-toast';

export default function MetricasCards() {
  const [metricas, setMetricas] = useState<MetricasBaseDatos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [sesionesModalOpen, setSesionesModalOpen] = useState(false);
  const [tablasModalOpen, setTablasModalOpen] = useState(false);

  const cargarMetricas = async () => {
    try {
      const data = await obtenerMetricasBaseDatos();
      setMetricas(data);
    } catch (error) {
      toast.error('Error al cargar métricas de la base de datos');
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  };

  useEffect(() => {
    cargarMetricas();
    const intervalo = setInterval(() => {
      setActualizando(true);
      cargarMetricas();
    }, 30000);
    
    return () => clearInterval(intervalo);
  }, []);

  if (cargando) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!metricas) return null;

  const { sesiones_activas, tamano_total, tablas_mas_pesadas, estadisticas } = metricas;

  return (
    <div className="space-y-6">
      {/* Cards principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: Tamaño total DB */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-[#E6E3DE]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#6E7C72]">Tamaño Total DB</h3>
            <svg className="w-5 h-5 text-[#6B8E7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1.5 3 3 3h10c1.5 0 3-1 3-3V7c0-2-1.5-3-3-3H7c-1.5 0-3 1-3 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-[#2C3E34]">{tamano_total.humano}</p>
          <button
            onClick={() => setTablasModalOpen(true)}
            className="mt-2 text-xs text-[#BD7D4A] hover:text-[#F58634] transition-colors font-semibold"
          >
            Ver detalle por tabla →
          </button>
        </div>

        {/* Card: Sesiones Activas */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-[#E6E3DE]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#6E7C72]">Sesiones Activas</h3>
            <svg className="w-5 h-5 text-[#6B8E7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-[#2C3E34]">{sesiones_activas.total}</p>
          <button
            onClick={() => setSesionesModalOpen(true)}
            className="mt-2 text-xs text-[#BD7D4A] hover:text-[#F58634] transition-colors font-semibold"
          >
            Ver detalles →
          </button>
        </div>

        {/* Card: Conexiones */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-[#E6E3DE]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#6E7C72]">Conexiones</h3>
            <svg className="w-5 h-5 text-[#6B8E7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-[#2C3E34]">
            {estadisticas.conexiones_actuales} <span className="text-sm font-normal text-[#6E7C72]">/ {estadisticas.conexiones_maximas}</span>
          </p>
          <div className="mt-2">
            <div className="w-full bg-[#E6E3DE] rounded-full h-1.5">
              <div 
                className="bg-[#6B8E7B] h-1.5 rounded-full" 
                style={{ width: `${Math.min((estadisticas.conexiones_actuales / estadisticas.conexiones_maximas) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card: Tablas e Índices */}
        <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-[#E6E3DE]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#6E7C72]">Estructura</h3>
            <svg className="w-5 h-5 text-[#6B8E7B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M6 14h6m-6 4h12M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
          </div>
          <div className="flex justify-between items-baseline">
            <p className="text-2xl font-bold text-[#2C3E34]">{estadisticas.total_tablas}</p>
            <p className="text-sm text-[#6E7C72]">tablas</p>
          </div>
          <div className="flex justify-between items-baseline mt-1">
            <p className="text-xs text-[#6E7C72]">{estadisticas.total_indices} índices</p>
            <p className="text-xs text-[#6E7C72]">{estadisticas.total_vistas} vistas</p>
          </div>
        </div>
      </div>

      {/* Tablas más pesadas */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#E6E3DE]">
        <div className="px-6 py-4 border-b border-[#E6E3DE] bg-[#FAF9F7]">
          <h3 className="text-lg font-bold text-[#6B8E7B]">Tablas más pesadas</h3>
          <p className="text-sm text-[#6E7C72] mt-1">Top 5 tablas por tamaño total</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E6E3DE]">
            <thead className="bg-[#FAF9F7]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Tabla</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Tamaño Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Datos</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Índices</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Filas</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">% DB</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E6E3DE]">
              {tablas_mas_pesadas.slice(0, 5).map((tabla) => (
                <tr key={tabla.nombre_tabla} className="hover:bg-[#FAF9F7] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-[#2C3E34]">{tabla.nombre_tabla}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-[#2C3E34]">{tabla.tamano_total_humano}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-[#6E7C72]">{tabla.tamano_datos_humano}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-[#6E7C72]">{tabla.tamano_indices_humano}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-[#6E7C72]">{tabla.numero_filas.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-[#E6E3DE] rounded-full h-1.5 mr-2">
                        <div 
                          className="bg-[#BD7D4A] h-1.5 rounded-full" 
                          style={{ width: `${Math.min(tabla.porcentaje_total, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-[#6E7C72]">{tabla.porcentaje_total.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mantenimiento */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-[#E6E3DE]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#6B8E7B]">Último mantenimiento</h3>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-[#6E7C72]">
                Último VACUUM: {estadisticas.ultimo_vacuum 
                  ? new Date(estadisticas.ultimo_vacuum).toLocaleString('es-MX')
                  : 'No registrado'}
              </p>
              <p className="text-xs text-[#6E7C72]">
                Último ANALYZE: {estadisticas.ultimo_analyze
                  ? new Date(estadisticas.ultimo_analyze).toLocaleString('es-MX')
                  : 'No registrado'}
              </p>
            </div>
          </div>
          {actualizando && (
            <div className="text-xs text-[#BD7D4A] animate-pulse">
              Actualizando...
            </div>
          )}
        </div>
      </div>

      {/* Modal de Sesiones Activas */}
      {sesionesModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#E6E3DE] px-6 py-4 flex justify-between items-center bg-[#FAF9F7]">
              <h3 className="text-lg font-bold text-[#6B8E7B]">
                Sesiones Activas ({sesiones_activas.total})
              </h3>
              <button
                onClick={() => setSesionesModalOpen(false)}
                className="text-[#6E7C72] hover:text-[#2C3E34] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {sesiones_activas.detalle.length === 0 ? (
                <p className="text-center text-[#6E7C72] py-8">No hay sesiones activas</p>
              ) : (
                <div className="space-y-4">
                  {sesiones_activas.detalle.map((sesion) => (
                    <div key={sesion.pid} className="border border-[#E6E3DE] rounded-lg p-4 bg-[#FAF9F7]">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-[#6B8E7B]">PID:</span>
                          <span className="ml-2 text-[#2C3E34]">{sesion.pid}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-[#6B8E7B]">Usuario:</span>
                          <span className="ml-2 text-[#2C3E34]">{sesion.usuario}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-[#6B8E7B]">Aplicación:</span>
                          <span className="ml-2 text-[#2C3E34]">{sesion.aplicacion}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-[#6B8E7B]">Cliente:</span>
                          <span className="ml-2 text-[#2C3E34]">{sesion.cliente}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-[#6B8E7B]">Estado:</span>
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            sesion.estado === 'active' ? 'bg-[#A8CF45]/20 text-[#2C3E34]' : 'bg-[#E6E3DE] text-[#6E7C72]'
                          }`}>
                            {sesion.estado}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-[#6B8E7B]">Conexión desde:</span>
                          <span className="ml-2 text-[#2C3E34]">{sesion.tiempo_conexion}</span>
                        </div>
                      </div>
                      {sesion.query_actual && (
                        <div className="mt-2">
                          <span className="font-semibold text-[#6B8E7B] text-sm">Query actual:</span>
                          <pre className="mt-1 text-xs bg-[#2C3E34] text-[#A8CF45] p-2 rounded overflow-x-auto font-mono">
                            {sesion.query_actual}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Tablas */}
      {tablasModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#E6E3DE] px-6 py-4 flex justify-between items-center bg-[#FAF9F7]">
              <h3 className="text-lg font-bold text-[#6B8E7B]">
                Detalle de Tablas - Tamaño Total: {tamano_total.humano}
              </h3>
              <button
                onClick={() => setTablasModalOpen(false)}
                className="text-[#6E7C72] hover:text-[#2C3E34] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <table className="min-w-full divide-y divide-[#E6E3DE]">
                <thead className="bg-[#FAF9F7]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Tabla</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Tamaño</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">% DB</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E6E3DE]">
                  {tamano_total.detalle_por_tabla.map((tabla) => (
                    <tr key={tabla.nombre_tabla} className="hover:bg-[#FAF9F7] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-[#2C3E34]">{tabla.nombre_tabla}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-[#6E7C72]">{tabla.tamano_humano}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-24 bg-[#E6E3DE] rounded-full h-1.5 mr-2">
                            <div 
                              className="bg-[#BD7D4A] h-1.5 rounded-full" 
                              style={{ width: `${Math.min(tabla.porcentaje, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-[#6E7C72]">{tabla.porcentaje.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}