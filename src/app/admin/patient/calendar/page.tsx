'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useSession,
} from 'next-auth/react';

import {
  useRouter,
} from 'next/navigation';

import {
  toast,
} from 'react-hot-toast';

import {
  getCalendarSettings,
  getExceptions,
  getPatientAppointmentsByDateRange,
  getPatientByUserId,
  getPatientUpcomingAppointments,
} from '@/lib/patient-appointments-actions';

import PatientAppointmentModal from '@/components/patient/PatientAppointmentModal';

import PatientAppointmentActionsModal from '@/components/patient/PatientAppointmentActionsModal';


export const dynamic =
  'force-dynamic';


const CONSULTORIO_TIME_ZONE =
  'America/Mexico_City';


interface DayInfo {
  date: Date;

  dateString: string;

  dayOfMonth: number;

  isCurrentMonth: boolean;

  hasAppointment: boolean;

  isException?: boolean;

  isWorkingDay?: boolean;

  isPastDate: boolean;
}


interface Appointment {
  id: number;

  appointment_date: string;

  start_time: string;

  end_time: string;

  status?: string;

  deposit_paid: boolean;

  deposit_amount: number;

  notes?: string;

  payment_status?: string;

  payment_reference?: string;

  payment_review_notes?: string;
}


interface MexicoNow {
  dateString: string;

  currentMinutes: number;
}


/**
 * Convierte una fecha creada en el navegador a YYYY-MM-DD
 * sin utilizar UTC y sin moverla al día anterior o siguiente.
 */
function formatLocalDate(
  date: Date,
): string {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(
      2,
      '0',
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      '0',
    );

  return `${year}-${month}-${day}`;
}


/**
 * Normaliza las fechas recibidas desde PostgreSQL.
 */
function normalizeDatabaseDate(
  value: unknown,
): string {
  if (
    value instanceof Date
  ) {
    /*
     * Las columnas DATE de PostgreSQL normalmente se
     * reciben a medianoche UTC. Se conserva su fecha ISO.
     */
    return value
      .toISOString()
      .slice(
        0,
        10,
      );
  }

  const textValue =
    String(
      value ?? '',
    ).trim();

  const dateMatch =
    textValue.match(
      /^\d{4}-\d{2}-\d{2}/,
    );

  return dateMatch?.[0] ?? '';
}


/**
 * Convierte una fecha YYYY-MM-DD a una fecha local al mediodía.
 * El mediodía evita los desplazamientos por zona horaria.
 */
function parseDateAtNoon(
  dateString: string,
): Date {
  return new Date(
    `${dateString}T12:00:00`,
  );
}


/**
 * Obtiene la fecha y hora actual de Ciudad de México.
 */
function getMexicoNow(): MexicoNow {
  const parts =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone:
          CONSULTORIO_TIME_ZONE,

        year:
          'numeric',

        month:
          '2-digit',

        day:
          '2-digit',

        hour:
          '2-digit',

        minute:
          '2-digit',

        hourCycle:
          'h23',
      },
    ).formatToParts(
      new Date(),
    );

  const values:
    Record<string, string> =
    {};

  parts.forEach(
    part => {
      if (
        part.type !==
        'literal'
      ) {
        values[
          part.type
        ] =
          part.value;
      }
    },
  );

  const hour =
    Number(
      values.hour,
    );

  const minute =
    Number(
      values.minute,
    );

  return {
    dateString:
      `${values.year}-${values.month}-${values.day}`,

    currentMinutes:
      hour * 60 +
      minute,
  };
}


/**
 * Convierte una hora HH:mm o HH:mm:ss a minutos.
 */
function timeToMinutes(
  timeValue: string,
): number {
  const [
    hour,
    minute,
  ] =
    String(
      timeValue ?? '',
    )
      .split(':')
      .map(Number);

  if (
    !Number.isFinite(
      hour,
    ) ||
    !Number.isFinite(
      minute,
    )
  ) {
    return 0;
  }

  return (
    hour * 60 +
    minute
  );
}


/**
 * Determina si la cita ya terminó.
 */
function isAppointmentPast(
  appointment: Appointment,
  mexicoNow:
    MexicoNow = getMexicoNow(),
): boolean {
  const appointmentDate =
    normalizeDatabaseDate(
      appointment.appointment_date,
    );

  if (
    appointmentDate <
    mexicoNow.dateString
  ) {
    return true;
  }

  if (
    appointmentDate >
    mexicoNow.dateString
  ) {
    return false;
  }

  /*
   * Si la cita es hoy, se considera pasada cuando
   * terminó su horario.
   */
  const appointmentEndTime =
    appointment.end_time ||
    appointment.start_time;

  return (
    timeToMinutes(
      appointmentEndTime,
    ) <=
    mexicoNow.currentMinutes
  );
}


/**
 * Muestra una fecha sin moverla por la zona horaria.
 */
function formatAppointmentDate(
  dateValue: string,
): string {
  const normalizedDate =
    normalizeDatabaseDate(
      dateValue,
    );

  if (
    !normalizedDate
  ) {
    return '';
  }

  const date =
    parseDateAtNoon(
      normalizedDate,
    );

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      weekday:
        'long',

      day:
        'numeric',

      month:
        'long',
    },
  ).format(
    date,
  );
}


/**
 * Texto del estado del anticipo.
 */
function getPaymentStatusText(
  appointment: Appointment,
): string {
  if (
    appointment.deposit_paid ||
    appointment.payment_status ===
      'approved'
  ) {
    return (
      `✓ Anticipo pagado ($${appointment.deposit_amount})`
    );
  }

  if (
    appointment.payment_status ===
      'submitted'
  ) {
    return (
      `⌛ Comprobante en revisión ($${appointment.deposit_amount})`
    );
  }

  if (
    appointment.payment_status ===
      'rejected'
  ) {
    return (
      '✕ Comprobante rechazado'
    );
  }

  return (
    `⚠ Anticipo pendiente ($${appointment.deposit_amount})`
  );
}


/**
 * Color del estado del anticipo.
 */
function getPaymentStatusClass(
  appointment: Appointment,
): string {
  if (
    appointment.deposit_paid ||
    appointment.payment_status ===
      'approved'
  ) {
    return (
      'bg-[#A8CF45]/20 text-[#2C3E34]'
    );
  }

  if (
    appointment.payment_status ===
      'submitted'
  ) {
    return (
      'bg-yellow-100 text-yellow-700'
    );
  }

  if (
    appointment.payment_status ===
      'rejected'
  ) {
    return (
      'bg-red-100 text-red-700'
    );
  }

  return (
    'bg-[#F58634]/20 text-[#2C3E34]'
  );
}


export default function PatientCalendarPage() {
  const {
    data:
      session,

    status,
  } =
    useSession();

  const router =
    useRouter();


  const [
    currentDate,
    setCurrentDate,
  ] =
    useState(
      new Date(),
    );

  const [
    calendarDays,
    setCalendarDays,
  ] =
    useState<DayInfo[]>(
      [],
    );

  const [
    selectedDay,
    setSelectedDay,
  ] =
    useState<Date | null>(
      null,
    );

  const [
    upcomingAppointments,
    setUpcomingAppointments,
  ] =
    useState<Appointment[]>(
      [],
    );

  const [
    depositAmount,
    setDepositAmount,
  ] =
    useState(
      100,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(
      false,
    );

  const [
    actionsModalOpen,
    setActionsModalOpen,
  ] =
    useState(
      false,
    );

  const [
    selectedAppointment,
    setSelectedAppointment,
  ] =
    useState<Appointment | null>(
      null,
    );

  const [
    patientId,
    setPatientId,
  ] =
    useState<number | null>(
      null,
    );


  const loadPatientData =
    useCallback(
      async () => {
        if (
          !session?.user?.id
        ) {
          return;
        }

        try {
          const patient =
            await getPatientByUserId(
              Number(
                session.user.id,
              ),
            );

          if (
            patient
          ) {
            setPatientId(
              Number(
                patient.id,
              ),
            );

            return;
          }

          toast.error(
            'No se encontró información del paciente.',
          );

          router.push(
            '/dashboard',
          );
        } catch (error) {
          console.error(
            'Error al cargar datos del paciente:',
            error,
          );

          toast.error(
            'Error al cargar los datos del paciente.',
          );
        }
      },
      [
        router,
        session,
      ],
    );


  // ==========================================================
  // AUTENTICACIÓN
  // ==========================================================

  useEffect(
    () => {
      if (
        status ===
        'unauthenticated'
      ) {
        router.push(
          '/login',
        );

        return;
      }

      if (
        status ===
        'authenticated'
      ) {
        if (
          session?.user?.rol_id !==
          2
        ) {
          toast.error(
            'Acceso no autorizado.',
          );

          router.push(
            '/dashboard',
          );

          return;
        }

        loadPatientData();
      }
    },
    [
      loadPatientData,
      router,
      session,
      status,
    ],
  );


  // ==========================================================
  // CAMBIAR MES
  // ==========================================================

  const changeMonth = (
    increment: number,
  ) => {
    const newDate =
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() +
          increment,
        1,
      );

    setCurrentDate(
      newDate,
    );

    setSelectedDay(
      null,
    );
  };


  // ==========================================================
  // CARGAR CALENDARIO
  // ==========================================================

  const loadMonthData =
    useCallback(
      async () => {
        if (
          !patientId
        ) {
          return;
        }

        setLoading(
          true,
        );

        const year =
          currentDate.getFullYear();

        const month =
          currentDate.getMonth();

        const firstDayOfMonth =
          new Date(
            year,
            month,
            1,
          );

        const lastDayOfMonth =
          new Date(
            year,
            month + 1,
            0,
          );

        const startDate =
          new Date(
            firstDayOfMonth,
          );

        startDate.setDate(
          startDate.getDate() -
          startDate.getDay(),
        );

        const endDate =
          new Date(
            lastDayOfMonth,
          );

        endDate.setDate(
          endDate.getDate() +
          (
            6 -
            endDate.getDay()
          ),
        );


        try {
          const settings =
            await getCalendarSettings();

          setDepositAmount(
            Number(
              settings.deposit_amount ??
              100,
            ),
          );


          const [
            appointments,
            exceptions,
          ] =
            await Promise.all([
              getPatientAppointmentsByDateRange(
                patientId,
                startDate,
                endDate,
              ),

              getExceptions(
                startDate,
                endDate,
              ),
            ]);


          /*
           * Las fechas de PostgreSQL se normalizan sin
           * convertir las fechas del calendario a UTC.
           */
          const appointmentsMap =
            new Map<string, boolean>();

          appointments.forEach(
            (
              appointment:
                Record<string, unknown>,
            ) => {
              const dateString =
                normalizeDatabaseDate(
                  appointment
                    .appointment_date,
                );

              if (
                dateString
              ) {
                appointmentsMap.set(
                  dateString,
                  true,
                );
              }
            },
          );


          const exceptionsMap =
            new Map<
              string,
              Record<string, unknown>
            >();

          exceptions.forEach(
            (
              exception:
                Record<string, unknown>,
            ) => {
              const dateString =
                normalizeDatabaseDate(
                  exception
                    .exception_date,
                );

              if (
                dateString
              ) {
                exceptionsMap.set(
                  dateString,
                  exception,
                );
              }
            },
          );


          const mexicoNow =
            getMexicoNow();


          const upcoming =
            await getPatientUpcomingAppointments(
              patientId,
            );


          /*
           * Normaliza las fechas y elimina de la lista
           * cualquier cita que ya haya terminado.
           */
          const normalizedUpcomingAppointments:
            Appointment[] =
            upcoming
              .map(
                (
                  appointment:
                    Record<string, unknown>,
                ) => ({
                  ...appointment,

                  id:
                    Number(
                      appointment.id,
                    ),

                  appointment_date:
                    normalizeDatabaseDate(
                      appointment
                        .appointment_date,
                    ),

                  start_time:
                    String(
                      appointment
                        .start_time ??
                      '',
                    ),

                  end_time:
                    String(
                      appointment
                        .end_time ??
                      '',
                    ),

                  deposit_paid:
                    Boolean(
                      appointment
                        .deposit_paid,
                    ),

                  deposit_amount:
                    Number(
                      appointment
                        .deposit_amount ??
                      0,
                    ),

                  notes:
                    appointment.notes
                      ? String(
                          appointment.notes,
                        )
                      : undefined,

                  status:
                    appointment.status
                      ? String(
                          appointment.status,
                        )
                      : undefined,

                  payment_status:
                    appointment.payment_status
                      ? String(
                          appointment
                            .payment_status,
                        )
                      : undefined,

                  payment_reference:
                    appointment.payment_reference
                      ? String(
                          appointment
                            .payment_reference,
                        )
                      : undefined,

                  payment_review_notes:
                    appointment.payment_review_notes
                      ? String(
                          appointment
                            .payment_review_notes,
                        )
                      : undefined,
                }),
              )
              .filter(
                appointment =>
                  !isAppointmentPast(
                    appointment,
                    mexicoNow,
                  ),
              );


          setUpcomingAppointments(
            normalizedUpcomingAppointments,
          );


          const days:
            DayInfo[] =
            [];

          let current =
            new Date(
              startDate,
            );


          while (
            current.getTime() <=
            endDate.getTime()
          ) {
            /*
             * Esta fecha se forma con valores locales.
             * No se utiliza toISOString().
             */
            const dateString =
              formatLocalDate(
                current,
              );

            const exception =
              exceptionsMap.get(
                dateString,
              );

            days.push({
              date:
                new Date(
                  current,
                ),

              dateString,

              dayOfMonth:
                current.getDate(),

              isCurrentMonth:
                current.getMonth() ===
                month,

              hasAppointment:
                appointmentsMap.get(
                  dateString,
                ) ??
                false,

              isException:
                Boolean(
                  exception,
                ),

              isWorkingDay:
                exception
                  ? Boolean(
                      exception
                        .is_working_day,
                    )
                  : true,

              isPastDate:
                dateString <
                mexicoNow.dateString,
            });

            current.setDate(
              current.getDate() +
              1,
            );
          }


          setCalendarDays(
            days,
          );
        } catch (error) {
          console.error(
            'Error al cargar datos del mes:',
            error,
          );

          toast.error(
            'Error al cargar los datos del calendario.',
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [
        currentDate,
        patientId,
      ],
    );


  useEffect(
    () => {
      if (
        patientId
      ) {
        loadMonthData();
      }
    },
    [
      loadMonthData,
      patientId,
    ],
  );


  // ==========================================================
  // EVENTOS
  // ==========================================================

  const handleDayClick = (
    day: DayInfo,
  ) => {
    if (
      !day.isCurrentMonth
    ) {
      return;
    }

    if (
      day.isPastDate
    ) {
      toast.error(
        'No puedes agendar una cita en una fecha que ya pasó.',
      );

      return;
    }

    if (
      !day.isWorkingDay ||
      day.date.getDay() ===
        0
    ) {
      toast.error(
        'No hay atención este día.',
      );

      return;
    }

    setSelectedDay(
      day.date,
    );
  };


  const handleAppointmentClick = (
    appointment: Appointment,
  ) => {
    if (
      isAppointmentPast(
        appointment,
      )
    ) {
      toast.error(
        'Esta cita ya terminó y no puede cancelarse ni reagendarse.',
      );

      return;
    }

    setSelectedAppointment(
      appointment,
    );

    setActionsModalOpen(
      true,
    );
  };


  const getDayColorClass = (
    day: DayInfo,
  ) => {
    if (
      !day.isCurrentMonth
    ) {
      return (
        'bg-[#FAF9F7] border-[#E6E3DE] cursor-default'
      );
    }

    if (
      !day.isWorkingDay ||
      day.date.getDay() ===
        0
    ) {
      return (
        'bg-gray-300 border-gray-400 cursor-not-allowed'
      );
    }

    if (
      day.hasAppointment
    ) {
      return (
        day.isPastDate
          ? 'bg-[#BD7D4A]/10 border-[#BD7D4A]/40 cursor-default'
          : 'bg-[#BD7D4A]/20 border-[#BD7D4A] hover:bg-[#BD7D4A]/25'
      );
    }

    if (
      day.isPastDate
    ) {
      return (
        'bg-gray-100 border-gray-200 cursor-not-allowed'
      );
    }

    return (
      'bg-white border-[#E6E3DE] hover:bg-[#FAF9F7]'
    );
  };


  const isToday = (
    day: DayInfo,
  ) => {
    return (
      day.dateString ===
      getMexicoNow()
        .dateString
    );
  };


  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];


  // ==========================================================
  // CARGANDO
  // ==========================================================

  if (
    loading ||
    !patientId
  ) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#FAF9F7]
          p-6
        "
      >
        <div className="text-[#6E7C72]">
          Cargando calendario...
        </div>
      </div>
    );
  }


  // ==========================================================
  // INTERFAZ
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#FAF9F7] p-6">
      <div className="mx-auto max-w-6xl">
        {/* Encabezado */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#5A8C7A]">
            Mis Citas
          </h1>

          <p className="mt-1 text-[#6E7C72]">
            Agenda, reprograma o cancela tus citas fácilmente
          </p>
        </div>


        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Calendario */}
          <div
            className="
              rounded-xl
              border
              border-[#E6E3DE]
              bg-white
              p-6
              shadow-sm
              lg:col-span-2
            "
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#5A8C7A]">
                {monthNames[
                  currentDate.getMonth()
                ]}
                {' '}
                {currentDate.getFullYear()}
              </h2>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={
                    () =>
                      changeMonth(
                        -1,
                      )
                  }
                  className="
                    rounded-lg
                    border
                    border-[#E6E3DE]
                    px-3
                    py-1
                    hover:bg-[#FAF9F7]
                  "
                  aria-label="Mes anterior"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={
                    () =>
                      changeMonth(
                        1,
                      )
                  }
                  className="
                    rounded-lg
                    border
                    border-[#E6E3DE]
                    px-3
                    py-1
                    hover:bg-[#FAF9F7]
                  "
                  aria-label="Mes siguiente"
                >
                  →
                </button>
              </div>
            </div>


            <div className="mb-2 grid grid-cols-7 gap-2">
              {[
                'Dom',
                'Lun',
                'Mar',
                'Mié',
                'Jue',
                'Vie',
                'Sáb',
              ].map(
                dayName => (
                  <div
                    key={
                      dayName
                    }
                    className="
                      py-2
                      text-center
                      text-sm
                      font-semibold
                      text-[#6E7C72]
                    "
                  >
                    {dayName}
                  </div>
                ),
              )}
            </div>


            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map(
                day => {
                  const isDisabled =
                    !day.isCurrentMonth ||
                    !day.isWorkingDay ||
                    day.date.getDay() ===
                      0 ||
                    day.isPastDate;

                  const isSelected =
                    selectedDay
                      ? formatLocalDate(
                          selectedDay,
                        ) ===
                        day.dateString
                      : false;


                  return (
                    <button
                      key={
                        day.dateString
                      }
                      type="button"
                      onClick={
                        () =>
                          handleDayClick(
                            day,
                          )
                      }
                      disabled={
                        isDisabled
                      }
                      className={`
                        min-h-20
                        rounded-xl
                        border-2
                        p-3
                        text-center
                        transition-all

                        ${getDayColorClass(
                          day,
                        )}

                        ${
                          day.isCurrentMonth
                            ? ''
                            : 'opacity-50'
                        }

                        ${
                          isSelected
                            ? 'ring-2 ring-[#5A8C7A] ring-offset-2'
                            : ''
                        }

                        ${
                          isToday(
                            day,
                          )
                            ? 'ring-2 ring-[#F58634] ring-offset-2'
                            : ''
                        }
                      `}
                    >
                      <div
                        className={`
                          font-bold

                          ${
                            !day.isWorkingDay ||
                            day.date.getDay() ===
                              0 ||
                            day.isPastDate
                              ? 'text-gray-500'
                              : 'text-[#2C3E34]'
                          }
                        `}
                      >
                        {day.dayOfMonth}
                      </div>


                      {day.hasAppointment && (
                        <div
                          className="
                            mt-1
                            text-xs
                            font-semibold
                            text-[#BD7D4A]
                          "
                        >
                          ✓ Cita
                        </div>
                      )}


                      {day.isWorkingDay ===
                        false && (
                        <div
                          className="
                            mt-1
                            text-xs
                            text-gray-500
                          "
                        >
                          No laborable
                        </div>
                      )}
                    </button>
                  );
                },
              )}
            </div>
          </div>


          {/* Panel lateral */}
          <div className="lg:col-span-1">
            <div
              className="
                sticky
                top-4
                rounded-xl
                border
                border-[#E6E3DE]
                bg-white
                p-6
                shadow-sm
              "
            >
              <h3 className="mb-4 text-lg font-bold text-[#5A8C7A]">
                Mis Próximas Citas
              </h3>


              <button
                type="button"
                onClick={
                  () =>
                    setModalOpen(
                      true,
                    )
                }
                disabled={
                  !selectedDay
                }
                className="
                  mb-4
                  w-full
                  rounded-lg
                  bg-[#BD7D4A]
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  transition-colors
                  hover:bg-[#F58634]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Agendar nueva cita

                {selectedDay
                  ? ` (${selectedDay.toLocaleDateString(
                      'es-MX',
                      {
                        day:
                          'numeric',

                        month:
                          'short',
                      },
                    )})`
                  : ''}
              </button>


              {!selectedDay && (
                <p
                  className="
                    mb-4
                    text-center
                    text-xs
                    text-[#6E7C72]
                  "
                >
                  Selecciona un día futuro en el calendario para agendar.
                </p>
              )}


              <div className="max-h-96 space-y-3 overflow-y-auto">
                {upcomingAppointments.length ===
                0 ? (
                  <p
                    className="
                      py-4
                      text-center
                      text-[#6E7C72]
                    "
                  >
                    No tienes citas próximas
                  </p>
                ) : (
                  upcomingAppointments.map(
                    appointment => {
                      const appointmentPast =
                        isAppointmentPast(
                          appointment,
                        );


                      return (
                        <div
                          key={
                            appointment.id
                          }
                          role={
                            appointmentPast
                              ? undefined
                              : 'button'
                          }
                          tabIndex={
                            appointmentPast
                              ? -1
                              : 0
                          }
                          onClick={
                            () => {
                              if (
                                !appointmentPast
                              ) {
                                handleAppointmentClick(
                                  appointment,
                                );
                              }
                            }
                          }
                          onKeyDown={
                            event => {
                              if (
                                !appointmentPast &&
                                (
                                  event.key ===
                                    'Enter' ||
                                  event.key ===
                                    ' '
                                )
                              ) {
                                handleAppointmentClick(
                                  appointment,
                                );
                              }
                            }
                          }
                          className={`
                            rounded-lg
                            border
                            border-[#E6E3DE]
                            bg-white
                            p-4
                            transition-shadow

                            ${
                              appointmentPast
                                ? 'cursor-default opacity-60'
                                : 'cursor-pointer hover:shadow-md'
                            }
                          `}
                        >
                          <div className="mb-2 flex items-baseline gap-2">
                            <span className="text-lg font-bold text-[#6B8E7B]">
                              {appointment.start_time.slice(
                                0,
                                5,
                              )}
                            </span>

                            <span className="text-xs text-[#6E7C72]">
                              -
                              {' '}
                              {appointment.end_time.slice(
                                0,
                                5,
                              )}
                            </span>
                          </div>


                          <div className="mb-2">
                            <div
                              className="
                                text-sm
                                capitalize
                                text-[#2C3E34]
                              "
                            >
                              {formatAppointmentDate(
                                appointment.appointment_date,
                              )}
                            </div>
                          </div>


                          <div className="mb-2">
                            <span
                              className={`
                                inline-block
                                rounded-full
                                px-2
                                py-1
                                text-xs

                                ${getPaymentStatusClass(
                                  appointment,
                                )}
                              `}
                            >
                              {getPaymentStatusText(
                                appointment,
                              )}
                            </span>
                          </div>


                          <div
                            className="
                              mt-2
                              border-t
                              border-[#E6E3DE]
                              pt-2
                              text-xs
                              text-[#6E7C72]
                            "
                          >
                            {appointmentPast
                              ? 'Esta cita ya terminó'
                              : 'Clic para gestionar'}
                          </div>
                        </div>
                      );
                    },
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      <PatientAppointmentModal
        isOpen={
          modalOpen
        }
        onClose={
          () =>
            setModalOpen(
              false,
            )
        }
        onSuccess={
          loadMonthData
        }
        selectedDate={
          selectedDay
        }
        patientId={
          patientId
        }
        depositAmount={
          depositAmount
        }
      />


      <PatientAppointmentActionsModal
        isOpen={
          actionsModalOpen
        }
        onClose={
          () => {
            setActionsModalOpen(
              false,
            );

            setSelectedAppointment(
              null,
            );
          }
        }
        onSuccess={
          loadMonthData
        }
        appointment={
          selectedAppointment
        }
        patientId={
          patientId
        }
      />
    </div>
  );
}