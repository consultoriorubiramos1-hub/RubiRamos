'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PatientDashboardClientProps {
  patient: any;
  upcomingAppointments: any[];
  appointmentHistory: any[];
  stats: any;
  posts: any[];
}

export default function PatientDashboardClient({ 
  patient, 
  upcomingAppointments, 
  appointmentHistory, 
  stats,
  posts 
}: PatientDashboardClientProps) {
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };
  
  const formatWeight = (weight: number) => {
    return `${weight.toFixed(1)} kg`;
  };
  
  const pesoPerdido = stats.pesoInicial && stats.pesoActual 
    ? stats.pesoInicial - stats.pesoActual 
    : null;
  
  const porcentajeProgreso = stats.pesoInicial && stats.pesoActual && pesoPerdido && pesoPerdido > 0
    ? ((pesoPerdido / (stats.pesoInicial - 70)) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Título de bienvenida */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#5A8C7A]">
          Hola, {patient.first_name} {patient.first_lastname}
        </h1>
        <p className="text-sm text-[#6E7C72] mt-1">
          Este es tu espacio personal para dar seguimiento a tu tratamiento nutricional
        </p>
      </div>
      
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#5A8C7A]">
          <p className="text-[#6E7C72] text-sm">Total de citas</p>
          <p className="text-2xl font-bold text-[#2C3E34]">{stats.totalCitas}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#BD7D4A]">
          <p className="text-[#6E7C72] text-sm">Citas completadas</p>
          <p className="text-2xl font-bold text-[#2C3E34]">{stats.citasCompletadas}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#A8CF45]">
          <p className="text-[#6E7C72] text-sm">Peso actual</p>
          <p className="text-2xl font-bold text-[#2C3E34]">
            {stats.pesoActual ? formatWeight(stats.pesoActual) : '—'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#F58634]">
          <p className="text-[#6E7C72] text-sm">Progreso</p>
          <p className="text-2xl font-bold text-[#2C3E34]">
            {pesoPerdido !== null && pesoPerdido > 0 ? `-${pesoPerdido.toFixed(1)} kg` : '—'}
          </p>
        </div>
      </div>
      
      {/* Próxima cita y progreso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próxima cita */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
          <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
            <h2 className="text-lg font-bold text-[#5A8C7A]">Próxima cita</h2>
          </div>
          <div className="p-6">
            {stats.proximaCita ? (
              <div className="space-y-3">
                <p className="text-2xl font-bold text-[#2C3E34]">
                  {formatDate(stats.proximaCita.appointment_date)}
                </p>
                <p className="text-lg text-[#BD7D4A] font-semibold">
                  {formatTime(stats.proximaCita.start_time)} horas
                </p>
                <div className="pt-4">
                  <Link 
                    href="/admin/patient/calendar"
                    className="inline-block px-4 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] transition-colors"
                  >
                    Ver calendario
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[#6E7C72]">No tienes próximas citas agendadas</p>
                <Link 
                  href="/admin/patient/calendar"
                  className="inline-block mt-4 px-4 py-2 bg-[#BD7D4A] text-white rounded-lg hover:bg-[#F58634] transition-colors"
                >
                  Agendar cita
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Progreso de peso */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
          <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
            <h2 className="text-lg font-bold text-[#5A8C7A]">Mi progreso</h2>
          </div>
          <div className="p-6">
            {stats.pesoInicial && stats.pesoActual ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-[#6E7C72]">Peso inicial</p>
                    <p className="text-xl font-bold text-[#2C3E34]">{formatWeight(stats.pesoInicial)}</p>
                  </div>
                  <div className="text-2xl text-[#6E7C72]">→</div>
                  <div>
                    <p className="text-sm text-[#6E7C72]">Peso actual</p>
                    <p className="text-xl font-bold text-[#2C3E34]">{formatWeight(stats.pesoActual)}</p>
                  </div>
                </div>
                
                {pesoPerdido !== null && pesoPerdido > 0 && (
                  <>
                    <div className="w-full bg-[#E6E3DE] rounded-full h-2">
                      <div 
                        className="bg-[#5A8C7A] h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(parseFloat(porcentajeProgreso || '0'), 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-[#A8CF45] font-semibold">
                        Has perdido {pesoPerdido.toFixed(1)} kg
                      </p>
                    </div>
                  </>
                )}
                
                {stats.ultimaEvaluacion && (
                  <p className="text-xs text-[#6E7C72] text-center pt-2 border-t border-[#E6E3DE]">
                    Última medición: {formatDate(stats.ultimaEvaluacion)}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[#6E7C72]">Aún no hay registros de peso</p>
                <p className="text-sm text-[#6E7C72] mt-1">Completa tu primera evaluación de seguimiento</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Próximas citas */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
        <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
          <h2 className="text-lg font-bold text-[#5A8C7A]">Próximas citas</h2>
        </div>
        <div className="overflow-x-auto">
          {upcomingAppointments.length > 0 ? (
            <table className="min-w-full divide-y divide-[#E6E3DE]">
              <thead className="bg-[#FAF9F7]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Anticipo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E6E3DE]">
                {upcomingAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-[#FAF9F7]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2C3E34]">
                      {formatDate(appointment.appointment_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2C3E34]">
                      {formatTime(appointment.start_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-[#5A8C7A]/20 text-[#2C3E34]">
                        {appointment.status === 'scheduled' ? 'Programada' : 'Completada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${appointment.deposit_paid ? 'bg-[#A8CF45]/20 text-[#2C3E34]' : 'bg-[#F58634]/20 text-[#2C3E34]'}`}>
                        {appointment.deposit_paid ? `Pagado ($${appointment.deposit_amount})` : `Pendiente ($${appointment.deposit_amount})`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-[#6E7C72]">
              No tienes próximas citas agendadas
            </div>
          )}
        </div>
      </div>
      
      {/* Muro de difusión */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
        <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
          <h2 className="text-lg font-bold text-[#5A8C7A]">Anuncios y novedades</h2>
        </div>
        <div className="p-6 space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="border-b border-[#E6E3DE] pb-4 last:border-0 last:pb-0">
                <h3 className="font-semibold text-[#2C3E34]">{post.title || 'Sin título'}</h3>
                {post.description && (
                  <p className="text-sm text-[#6E7C72] mt-1 italic">{post.description}</p>
                )}
                {post.content && (
                  <p className="text-sm text-[#2C3E34] mt-2">{post.content}</p>
                )}
                {post.images && post.images.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {post.images.slice(0, 2).map((img: string, idx: number) => (
                      <img key={idx} src={img} alt="" className="h-20 w-full object-cover rounded-lg" />
                    ))}
                  </div>
                )}
                <p className="text-xs text-[#6E7C72] mt-2">
                  Publicado el {formatDate(post.created_at)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-[#6E7C72] py-4">No hay novedades recientes</p>
          )}
        </div>
      </div>
      
      {/* Historial de citas */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
        <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
          <h2 className="text-lg font-bold text-[#5A8C7A]">Historial de citas</h2>
        </div>
        <div className="overflow-x-auto">
          {appointmentHistory.length > 0 ? (
            <table className="min-w-full divide-y divide-[#E6E3DE]">
              <thead className="bg-[#FAF9F7]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Anticipo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E6E3DE]">
                {appointmentHistory.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-[#FAF9F7]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2C3E34]">
                      {formatDate(appointment.appointment_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2C3E34]">
                      {formatTime(appointment.start_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-[#A8CF45]/20 text-[#2C3E34]">
                        {appointment.status === 'completed' ? 'Completada' : 'Programada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${appointment.deposit_paid ? 'bg-[#A8CF45]/20 text-[#2C3E34]' : 'bg-[#F58634]/20 text-[#2C3E34]'}`}>
                        {appointment.deposit_paid ? `Pagado ($${appointment.deposit_amount})` : `Pendiente ($${appointment.deposit_amount})`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-[#6E7C72]">
              No hay citas en el historial
            </div>
          )}
        </div>
      </div>
    </div>
  );
}