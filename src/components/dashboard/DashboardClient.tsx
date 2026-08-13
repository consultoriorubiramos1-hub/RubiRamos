'use client';

import Link from 'next/link';


type RiskLevel =
  | 'Bajo'
  | 'Medio'
  | 'Alto';


interface AttendancePrediction {
  no_show_probability: number;

  attendance_probability: number;

  no_show_percentage: number;

  attendance_percentage: number;

  risk_level: RiskLevel;

  predicted_no_show: number;

  prediction: string;

  target_name: string;

  model_name: string;
}


interface WeeklyAppointment {
  id: number;

  patientId: number;

  appointmentDate: string;

  time: string;

  endTime: string | null;

  patientName: string;

  phone: string;

  email: string;

  type: string;

  status: string;

  prediction:
    | AttendancePrediction
    | null;

  predictionAvailable: boolean;

  predictionMessage: string;

  recommendation: string;
}


interface DashboardStats {
  todayAppointments: number;

  weeklyAppointments: number;

  totalPatients: number;

  newPatientsMonth: number;

  completionRate: number;

  nextAppointment: {
    id: number;

    patientName: string;

    date?: string;

    time: string;

    type: string;

    duration: string;
  } | null;

  todayAppointmentsList: Array<{
    id: number;

    time: string;

    patientName: string;

    status: string;
  }>;

  weeklyAppointmentsList:
    WeeklyAppointment[];

  recentPatients: Array<{
    id: number;

    name: string;

    lastVisit: string;

    status: string;
  }>;

  weeklyStats: Array<{
    day: string;

    appointments: number;
  }>;
}


interface DashboardClientProps {
  stats: DashboardStats;

  userName: string;
}


function formatDashboardDate(): string {
  return new Intl.DateTimeFormat(
    'es-MX',
    {
      timeZone:
        'America/Mexico_City',

      weekday:
        'long',

      year:
        'numeric',

      month:
        'long',

      day:
        'numeric',
    },
  ).format(
    new Date(),
  );
}


function formatAppointmentDate(
  dateValue: string,
): string {
  if (!dateValue) {
    return '';
  }

  /*
   * Se agrega una hora intermedia para evitar que
   * la fecha cambie por la zona horaria del navegador.
   */
  const appointmentDate =
    new Date(
      `${dateValue}T12:00:00`,
    );

  if (
    Number.isNaN(
      appointmentDate.getTime(),
    )
  ) {
    return dateValue;
  }

  const formattedDate =
    new Intl.DateTimeFormat(
      'es-MX',
      {
        weekday:
          'short',

        day:
          'numeric',

        month:
          'short',
      },
    ).format(
      appointmentDate,
    );

  return formattedDate
    .replace(
      '.',
      '',
    )
    .replace(
      /^./,
      letter =>
        letter.toUpperCase(),
    );
}


function getRiskStyles(
  riskLevel: RiskLevel,
) {
  if (
    riskLevel === 'Alto'
  ) {
    return {
      badge:
        'bg-red-100 text-red-700 border-red-200',

      border:
        'border-l-red-500',

      icon:
        'bg-red-100 text-red-600',

      percentage:
        'text-red-600',

      bar:
        'bg-red-500',

      recommendation:
        'bg-red-50 border-red-100 text-red-700',
    };
  }

  if (
    riskLevel === 'Medio'
  ) {
    return {
      badge:
        'bg-[#BD7D4A]/15 text-[#9A5F31] border-[#BD7D4A]/25',

      border:
        'border-l-[#BD7D4A]',

      icon:
        'bg-[#BD7D4A]/15 text-[#BD7D4A]',

      percentage:
        'text-[#BD7D4A]',

      bar:
        'bg-[#BD7D4A]',

      recommendation:
        'bg-[#BD7D4A]/10 border-[#BD7D4A]/20 text-[#87532C]',
    };
  }

  return {
    badge:
      'bg-[#A8CF45]/20 text-[#526B22] border-[#A8CF45]/30',

    border:
      'border-l-[#6B8E7B]',

    icon:
      'bg-[#6B8E7B]/10 text-[#6B8E7B]',

    percentage:
      'text-[#6B8E7B]',

    bar:
      'bg-[#6B8E7B]',

    recommendation:
      'bg-[#6B8E7B]/10 border-[#6B8E7B]/15 text-[#4A6B59]',
  };
}


function getPredictionIcon(
  riskLevel: RiskLevel,
) {
  if (
    riskLevel === 'Alto'
  ) {
    return (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
        />
      </svg>
    );
  }

  if (
    riskLevel === 'Medio'
  ) {
    return (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
  }

  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}


export default function DashboardClient({
  stats,
  userName,
}: DashboardClientProps) {
  const maxWeeklyAppointments =
    Math.max(
      ...stats.weeklyStats.map(
        statistic =>
          statistic.appointments,
      ),
      1,
    );

  const weeklyAppointmentsList =
    stats.weeklyAppointmentsList ??
    [];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#6B8E7B]">
            Bienvenida, {userName}
          </h1>

          <p className="text-sm text-[#6E7C72] mt-1">
            Hoy es {formatDashboardDate()}
          </p>
        </div>


        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Citas hoy */}
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#6B8E7B]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6E7C72] text-sm font-medium">
                  Citas Hoy
                </p>

                <p className="text-2xl font-bold text-[#2C3E34] mt-1">
                  {stats.todayAppointments}
                </p>
              </div>

              <div className="w-10 h-10 bg-[#6B8E7B]/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-[#6B8E7B]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>


          {/* Citas semanales */}
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#BD7D4A]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6E7C72] text-sm font-medium">
                  Esta Semana
                </p>

                <p className="text-2xl font-bold text-[#2C3E34] mt-1">
                  {stats.weeklyAppointments}
                </p>
              </div>

              <div className="w-10 h-10 bg-[#BD7D4A]/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-[#BD7D4A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>


          {/* Pacientes totales */}
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#A8CF45]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6E7C72] text-sm font-medium">
                  Pacientes Activos
                </p>

                <p className="text-2xl font-bold text-[#2C3E34] mt-1">
                  {stats.totalPatients}
                </p>
              </div>

              <div className="w-10 h-10 bg-[#A8CF45]/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-[#A8CF45]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="mt-2 text-xs text-[#6E7C72]">
              +{stats.newPatientsMonth} nuevos este mes
            </div>
          </div>


          {/* Tasa de completación */}
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#F58634]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6E7C72] text-sm font-medium">
                  Completación
                </p>

                <p className="text-2xl font-bold text-[#2C3E34] mt-1">
                  {stats.completionRate}%
                </p>
              </div>

              <div className="w-10 h-10 bg-[#F58634]/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-[#F58634]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Próxima cita */}
            {stats.nextAppointment && (
              <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
                <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
                  <h2 className="text-lg font-bold text-[#6B8E7B] flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>

                    Próxima Cita
                  </h2>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#2C3E34]">
                        {stats.nextAppointment.patientName}
                      </h3>

                      <p className="text-[#6E7C72] text-sm mt-1">
                        {stats.nextAppointment.type}
                      </p>

                      {stats.nextAppointment.date && (
                        <p className="text-[#6E7C72] text-xs mt-1">
                          {formatAppointmentDate(
                            stats.nextAppointment.date,
                          )}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#BD7D4A]">
                        {stats.nextAppointment.time}
                      </div>

                      <div className="text-sm text-[#6E7C72]">
                        {stats.nextAppointment.duration}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Link
                      href="/admin/pacientes"
                      className="flex-1 py-2 bg-[#6B8E7B] text-white text-center font-semibold rounded-lg hover:bg-[#4A7C6A] transition-colors"
                    >
                      Ver pacientes
                    </Link>

                    <Link
                      href="/admin/appointments"
                      className="flex-1 py-2 bg-[#BD7D4A] text-white text-center font-semibold rounded-lg hover:bg-[#F58634] transition-colors"
                    >
                      Ver agenda
                    </Link>
                  </div>
                </div>
              </div>
            )}


            {/* Predicción automática semanal */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
              <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-bold text-[#6B8E7B] flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>

                      Citas próximas de la semana
                    </h3>

                    <p className="text-xs text-[#6E7C72] mt-1">
                      El riesgo se calcula automáticamente con el historial de cada paciente.
                    </p>
                  </div>

                  <div className="px-3 py-1 rounded-full bg-[#6B8E7B]/10 text-[#6B8E7B] text-xs font-semibold">
                    {weeklyAppointmentsList.length}
                    {' '}
                    {weeklyAppointmentsList.length === 1
                      ? 'cita programada'
                      : 'citas programadas'}
                  </div>
                </div>
              </div>


              <div className="p-4 space-y-4">
                {weeklyAppointmentsList.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#6B8E7B]/10 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-[#6B8E7B]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>

                    <p className="text-[#2C3E34] font-semibold mt-3">
                      No hay citas próximas esta semana
                    </p>

                    <p className="text-[#6E7C72] text-sm mt-1">
                      Las citas programadas aparecerán aquí automáticamente.
                    </p>
                  </div>
                ) : (
                  weeklyAppointmentsList.map(
                    appointment => {
                      const prediction =
                        appointment.prediction;

                      if (
                        !appointment.predictionAvailable ||
                        !prediction
                      ) {
                        return (
                          <div
                            key={appointment.id}
                            className="border border-[#E6E3DE] border-l-4 border-l-gray-300 rounded-xl p-4"
                          >
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                              <div>
                                <div className="flex items-center gap-2 text-sm text-[#6E7C72]">
                                  <span className="font-semibold">
                                    {formatAppointmentDate(
                                      appointment.appointmentDate,
                                    )}
                                  </span>

                                  <span>•</span>

                                  <span>
                                    {appointment.time}
                                  </span>
                                </div>

                                <h4 className="text-base font-bold text-[#2C3E34] mt-1">
                                  {appointment.patientName}
                                </h4>

                                <p className="text-xs text-[#6E7C72] mt-1">
                                  {appointment.type}
                                </p>
                              </div>

                              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                                Riesgo no disponible
                              </span>
                            </div>

                            <div className="mt-4 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600">
                              {appointment.predictionMessage ||
                                'No fue posible generar la predicción para esta cita.'}
                            </div>
                          </div>
                        );
                      }

                      const riskStyles =
                        getRiskStyles(
                          prediction.risk_level,
                        );

                      const noShowPercentage =
                        Math.min(
                          Math.max(
                            prediction.no_show_percentage,
                            0,
                          ),
                          100,
                        );

                      return (
                        <div
                          key={appointment.id}
                          className={`border border-[#E6E3DE] border-l-4 ${riskStyles.border} rounded-xl p-4`}
                        >
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-sm text-[#6E7C72] flex-wrap">
                                <span className="font-semibold">
                                  {formatAppointmentDate(
                                    appointment.appointmentDate,
                                  )}
                                </span>

                                <span>•</span>

                                <span>
                                  {appointment.time}
                                  {appointment.endTime
                                    ? ` - ${appointment.endTime}`
                                    : ''}
                                </span>
                              </div>

                              <h4 className="text-base font-bold text-[#2C3E34] mt-1">
                                {appointment.patientName}
                              </h4>

                              <p className="text-xs text-[#6E7C72] mt-1">
                                {appointment.type}
                              </p>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${riskStyles.badge}`}
                            >
                              Riesgo {prediction.risk_level}
                            </span>
                          </div>


                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                            <div className="bg-[#FAF9F7] rounded-lg p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center ${riskStyles.icon}`}
                                  >
                                    {getPredictionIcon(
                                      prediction.risk_level,
                                    )}
                                  </div>

                                  <div>
                                    <p className="text-xs text-[#6E7C72]">
                                      Probabilidad de inasistencia
                                    </p>

                                    <p
                                      className={`text-xl font-bold ${riskStyles.percentage}`}
                                    >
                                      {prediction.no_show_percentage.toFixed(
                                        2,
                                      )}
                                      %
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="w-full h-2 bg-[#E6E3DE] rounded-full mt-3 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${riskStyles.bar}`}
                                  style={{
                                    width:
                                      `${noShowPercentage}%`,
                                  }}
                                />
                              </div>
                            </div>


                            <div className="bg-[#FAF9F7] rounded-lg p-3">
                              <p className="text-xs text-[#6E7C72]">
                                Resultado estimado
                              </p>

                              <p className="text-base font-bold text-[#2C3E34] mt-1">
                                {prediction.prediction}
                              </p>

                              <p className="text-xs text-[#6E7C72] mt-1">
                                Asistencia estimada:
                                {' '}
                                {prediction.attendance_percentage.toFixed(
                                  2,
                                )}
                                %
                              </p>
                            </div>
                          </div>


                          <div
                            className={`mt-3 px-3 py-2.5 rounded-lg border text-sm flex items-start gap-2 ${riskStyles.recommendation}`}
                          >
                            <svg
                              className="w-4 h-4 mt-0.5 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>

                            <div>
                              <span className="font-semibold">
                                Recomendación:
                              </span>

                              {' '}

                              {appointment.recommendation}
                            </div>
                          </div>


                          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                            <div className="text-xs text-[#6E7C72]">
                              Predicción generada automáticamente
                            </div>

                            <Link
                              href="/admin/pacientes"
                              className="text-xs font-semibold text-[#6B8E7B] hover:text-[#4A7C6A] hover:underline"
                            >
                              Ver pacientes
                            </Link>
                          </div>
                        </div>
                      );
                    },
                  )
                )}
              </div>
            </div>
          </div>


          {/* Sidebar */}
          <div className="space-y-6">
            {/* Gráfica de citas semanales */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
              <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
                <h3 className="text-lg font-bold text-[#6B8E7B] flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>

                  Citas Esta Semana
                </h3>
              </div>

              <div className="p-6 space-y-3">
                {stats.weeklyStats.map(
                  day => (
                    <div
                      key={day.day}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-[#6E7C72] w-8">
                        {day.day}
                      </span>

                      <div className="flex-1 mx-3">
                        <div
                          className="bg-[#6B8E7B] rounded-full h-2 transition-all duration-300"
                          style={{
                            width:
                              `${(
                                day.appointments /
                                maxWeeklyAppointments
                              ) * 100}%`,
                          }}
                        />
                      </div>

                      <span className="text-sm font-medium text-[#2C3E34] w-8 text-right">
                        {day.appointments}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>


            {/* Pacientes recientes */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
              <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
                <h3 className="text-lg font-bold text-[#6B8E7B] flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>

                  Pacientes Recientes
                </h3>
              </div>

              <div className="p-4 space-y-2">
                {stats.recentPatients.length === 0 ? (
                  <p className="text-center text-[#6E7C72] py-4">
                    No hay pacientes registrados
                  </p>
                ) : (
                  stats.recentPatients.map(
                    patient => (
                      <div
                        key={patient.id}
                        className="flex items-center justify-between p-3 bg-[#FAF9F7] rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-[#2C3E34]">
                            {patient.name}
                          </p>

                          <p className="text-xs text-[#6E7C72]">
                            Última visita:
                            {' '}
                            {patient.lastVisit}
                          </p>
                        </div>

                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#A8CF45]/20 text-[#2C3E34]">
                          {patient.status}
                        </span>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}