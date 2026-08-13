'use client';

import {
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'react-hot-toast';

import {
  approvePaymentReceipt,
  rejectPaymentReceipt,
} from '@/lib/payment-review-actions';

import type {
  PendingPaymentAppointment,
} from '@/lib/payment-review-actions';


interface PendingPaymentsReviewProps {
  initialAppointments:
    PendingPaymentAppointment[];
}


function formatAppointmentDate(
  dateValue: string,
): string {
  const date =
    new Date(
      `${dateValue}T12:00:00`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      weekday:
        'long',

      day:
        'numeric',

      month:
        'long',

      year:
        'numeric',
    },
  ).format(
    date,
  );
}


function formatSubmittedDate(
  dateValue:
    | string
    | null,
): string {
  if (
    !dateValue
  ) {
    return (
      'Fecha de envío no disponible'
    );
  }

  const date =
    new Date(
      dateValue,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      dateStyle:
        'medium',

      timeStyle:
        'short',
    },
  ).format(
    date,
  );
}


export default function PendingPaymentsReview({
  initialAppointments,
}: PendingPaymentsReviewProps) {
  const router =
    useRouter();


  const [
    processingAppointmentId,
    setProcessingAppointmentId,
  ] =
    useState<number | null>(
      null,
    );


  const [
    selectedReceipt,
    setSelectedReceipt,
  ] =
    useState<PendingPaymentAppointment | null>(
      null,
    );


  const [
    appointmentToReject,
    setAppointmentToReject,
  ] =
    useState<PendingPaymentAppointment | null>(
      null,
    );


  const [
    rejectionNotes,
    setRejectionNotes,
  ] =
    useState('');


  const [
    localAppointments,
    setLocalAppointments,
  ] =
    useState(
      initialAppointments,
    );


  const handleApprove =
    async (
      appointment:
        PendingPaymentAppointment,
    ) => {
      const confirmed =
        window.confirm(
          `¿Aprobar el comprobante de ${appointment.patientName}?\n\n` +
          'La cita quedará confirmada y el anticipo se marcará como pagado.',
        );


      if (
        !confirmed
      ) {
        return;
      }


      setProcessingAppointmentId(
        appointment.id,
      );


      try {
        const result =
          await approvePaymentReceipt(
            appointment.id,
          );


        if (
          !result.success
        ) {
          toast.error(
            result.message,
          );

          return;
        }


        setLocalAppointments(
          currentAppointments =>
            currentAppointments.filter(
              item =>
                item.id !==
                appointment.id,
            ),
        );


        setSelectedReceipt(
          null,
        );


        toast.success(
          result.message,
        );


        router.refresh();
      } catch (error) {
        console.error(
          'Error al aprobar el comprobante:',
          error,
        );

        toast.error(
          'No se pudo aprobar el comprobante.',
        );
      } finally {
        setProcessingAppointmentId(
          null,
        );
      }
    };


  const openRejectModal = (
    appointment:
      PendingPaymentAppointment,
  ) => {
    setAppointmentToReject(
      appointment,
    );

    setRejectionNotes(
      '',
    );
  };


  const closeRejectModal = () => {
    if (
      processingAppointmentId !==
      null
    ) {
      return;
    }

    setAppointmentToReject(
      null,
    );

    setRejectionNotes(
      '',
    );
  };


  const handleReject =
    async () => {
      if (
        !appointmentToReject
      ) {
        return;
      }


      const normalizedNotes =
        rejectionNotes.trim();


      if (
        normalizedNotes.length <
        5
      ) {
        toast.error(
          'Escribe un motivo de rechazo de al menos 5 caracteres.',
        );

        return;
      }


      setProcessingAppointmentId(
        appointmentToReject.id,
      );


      try {
        const result =
          await rejectPaymentReceipt(
            appointmentToReject.id,
            normalizedNotes,
          );


        if (
          !result.success
        ) {
          toast.error(
            result.message,
          );

          return;
        }


        setLocalAppointments(
          currentAppointments =>
            currentAppointments.filter(
              item =>
                item.id !==
                appointmentToReject.id,
            ),
        );


        setSelectedReceipt(
          null,
        );

        setAppointmentToReject(
          null,
        );

        setRejectionNotes(
          '',
        );


        toast.success(
          result.message,
        );


        router.refresh();
      } catch (error) {
        console.error(
          'Error al rechazar el comprobante:',
          error,
        );

        toast.error(
          'No se pudo rechazar el comprobante.',
        );
      } finally {
        setProcessingAppointmentId(
          null,
        );
      }
    };


  return (
    <>
      <section
        className="
          mb-8
          overflow-hidden
          rounded-xl
          border
          border-[#E6E3DE]
          bg-white
          shadow-sm
        "
      >
        {/* Encabezado */}
        <div
          className="
            flex
            flex-col
            gap-3
            border-b
            border-[#E6E3DE]
            bg-[#FAF9F7]
            px-6
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h2
              className="
                flex
                items-center
                gap-2
                text-lg
                font-bold
                text-[#6B8E7B]
              "
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

              Comprobantes pendientes
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-[#6E7C72]
              "
            >
              Revisa el anticipo antes de confirmar la cita.
            </p>
          </div>


          <div
            className="
              inline-flex
              w-fit
              items-center
              gap-2
              rounded-full
              bg-[#BD7D4A]/15
              px-3
              py-1.5
              text-sm
              font-bold
              text-[#9A5F31]
            "
          >
            <span
              className="
                h-2
                w-2
                rounded-full
                bg-[#BD7D4A]
              "
            />

            {localAppointments.length}

            {' '}

            {localAppointments.length === 1
              ? 'por revisar'
              : 'por revisar'}
          </div>
        </div>


        <div className="p-5">
          {localAppointments.length === 0 ? (
            <div
              className="
                py-10
                text-center
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-[#A8CF45]/15
                  text-[#6B8E7B]
                "
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <p
                className="
                  mt-3
                  font-semibold
                  text-[#2C3E34]
                "
              >
                No hay comprobantes pendientes
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-[#6E7C72]
                "
              >
                Las nuevas solicitudes aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            <div
              className="
                grid
                grid-cols-1
                gap-5
                xl:grid-cols-2
              "
            >
              {localAppointments.map(
                appointment => {
                  const isProcessing =
                    processingAppointmentId ===
                    appointment.id;


                  return (
                    <article
                      key={
                        appointment.id
                      }
                      className="
                        overflow-hidden
                        rounded-xl
                        border
                        border-[#E6E3DE]
                        bg-white
                      "
                    >
                      {/* Datos de la cita */}
                      <div
                        className="
                          border-b
                          border-[#E6E3DE]
                          bg-[#FAF9F7]
                          p-4
                        "
                      >
                        <div
                          className="
                            flex
                            items-start
                            justify-between
                            gap-3
                          "
                        >
                          <div>
                            <h3
                              className="
                                font-bold
                                text-[#2C3E34]
                              "
                            >
                              {appointment.patientName}
                            </h3>

                            <p
                              className="
                                mt-1
                                capitalize
                                text-sm
                                text-[#6E7C72]
                              "
                            >
                              {formatAppointmentDate(
                                appointment.appointmentDate,
                              )}
                            </p>

                            <p
                              className="
                                mt-1
                                text-sm
                                font-semibold
                                text-[#BD7D4A]
                              "
                            >
                              {appointment.startTime}
                              {' - '}
                              {appointment.endTime}
                            </p>
                          </div>


                          <span
                            className="
                              rounded-full
                              bg-yellow-100
                              px-3
                              py-1
                              text-xs
                              font-bold
                              text-yellow-700
                            "
                          >
                            Por revisar
                          </span>
                        </div>
                      </div>


                      {/* Comprobante */}
                      <button
                        type="button"
                        onClick={
                          () =>
                            setSelectedReceipt(
                              appointment,
                            )
                        }
                        className="
                          group
                          block
                          w-full
                          bg-[#F4F2EE]
                          text-left
                        "
                      >
                        <div
                          className="
                            flex
                            h-52
                            items-center
                            justify-center
                            overflow-hidden
                          "
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              appointment.paymentReceiptUrl
                            }
                            alt={`Comprobante de ${appointment.patientName}`}
                            className="
                              h-full
                              w-full
                              object-contain
                              transition-transform
                              duration-200
                              group-hover:scale-[1.02]
                            "
                          />
                        </div>

                        <div
                          className="
                            flex
                            items-center
                            justify-center
                            gap-2
                            border-t
                            border-[#E6E3DE]
                            bg-white
                            px-3
                            py-2
                            text-xs
                            font-semibold
                            text-[#6B8E7B]
                          "
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-4 4H5a2 2 0 01-2-2V8a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2z"
                            />
                          </svg>

                          Abrir comprobante
                        </div>
                      </button>


                      {/* Información bancaria */}
                      <div
                        className="
                          space-y-3
                          p-4
                        "
                      >
                        <div
                          className="
                            grid
                            grid-cols-1
                            gap-3
                            sm:grid-cols-2
                          "
                        >
                          <div>
                            <p
                              className="
                                text-xs
                                text-[#6E7C72]
                              "
                            >
                              Monto
                            </p>

                            <p
                              className="
                                font-bold
                                text-[#2C3E34]
                              "
                            >
                              $
                              {appointment.depositAmount.toFixed(
                                2,
                              )}
                              {' '}
                              MXN
                            </p>
                          </div>


                          <div>
                            <p
                              className="
                                text-xs
                                text-[#6E7C72]
                              "
                            >
                              Concepto
                            </p>

                            <p
                              className="
                                break-all
                                text-sm
                                font-bold
                                text-[#BD7D4A]
                              "
                            >
                              {appointment.paymentReference}
                            </p>
                          </div>
                        </div>


                        <div>
                          <p
                            className="
                              text-xs
                              text-[#6E7C72]
                            "
                          >
                            Comprobante enviado
                          </p>

                          <p
                            className="
                              text-sm
                              text-[#2C3E34]
                            "
                          >
                            {formatSubmittedDate(
                              appointment.paymentSubmittedAt,
                            )}
                          </p>
                        </div>


                        {(appointment.phone ||
                          appointment.email) && (
                          <div
                            className="
                              rounded-lg
                              bg-[#FAF9F7]
                              p-3
                            "
                          >
                            {appointment.phone && (
                              <p
                                className="
                                  text-sm
                                  text-[#2C3E34]
                                "
                              >
                                <strong>
                                  Teléfono:
                                </strong>

                                {' '}

                                {appointment.phone}
                              </p>
                            )}

                            {appointment.email && (
                              <p
                                className="
                                  mt-1
                                  break-all
                                  text-sm
                                  text-[#2C3E34]
                                "
                              >
                                <strong>
                                  Correo:
                                </strong>

                                {' '}

                                {appointment.email}
                              </p>
                            )}
                          </div>
                        )}


                        {appointment.notes && (
                          <div
                            className="
                              rounded-lg
                              border-l-4
                              border-[#6B8E7B]
                              bg-[#6B8E7B]/10
                              p-3
                            "
                          >
                            <p
                              className="
                                text-xs
                                font-semibold
                                text-[#4A6B59]
                              "
                            >
                              Notas del paciente
                            </p>

                            <p
                              className="
                                mt-1
                                text-sm
                                text-[#2C3E34]
                              "
                            >
                              {appointment.notes}
                            </p>
                          </div>
                        )}


                        {/* Acciones */}
                        <div
                          className="
                            grid
                            grid-cols-1
                            gap-3
                            pt-2
                            sm:grid-cols-2
                          "
                        >
                          <button
                            type="button"
                            onClick={
                              () =>
                                openRejectModal(
                                  appointment,
                                )
                            }
                            disabled={
                              isProcessing
                            }
                            className="
                              rounded-lg
                              border
                              border-red-200
                              px-4
                              py-2.5
                              text-sm
                              font-semibold
                              text-red-600
                              transition-colors
                              hover:bg-red-50
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                            "
                          >
                            Rechazar
                          </button>


                          <button
                            type="button"
                            onClick={
                              () =>
                                handleApprove(
                                  appointment,
                                )
                            }
                            disabled={
                              isProcessing
                            }
                            className="
                              inline-flex
                              items-center
                              justify-center
                              gap-2
                              rounded-lg
                              bg-[#6B8E7B]
                              px-4
                              py-2.5
                              text-sm
                              font-semibold
                              text-white
                              transition-colors
                              hover:bg-[#4A7C6A]
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                            "
                          >
                            {isProcessing ? (
                              <>
                                <span
                                  className="
                                    h-4
                                    w-4
                                    animate-spin
                                    rounded-full
                                    border-2
                                    border-white/40
                                    border-t-white
                                  "
                                />

                                Procesando...
                              </>
                            ) : (
                              <>
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>

                                Aprobar anticipo
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </div>
      </section>


      {/* Vista completa del comprobante */}
      {selectedReceipt && (
        <div
          className="
            fixed
            inset-0
            z-[80]
            flex
            items-center
            justify-center
            bg-black/70
            p-4
          "
          onMouseDown={
            event => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSelectedReceipt(
                  null,
                );
              }
            }
          }
        >
          <div
            className="
              flex
              max-h-[94vh]
              w-full
              max-w-4xl
              flex-col
              overflow-hidden
              rounded-xl
              bg-white
              shadow-2xl
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-[#E6E3DE]
                px-5
                py-4
              "
            >
              <div>
                <h3
                  className="
                    font-bold
                    text-[#2C3E34]
                  "
                >
                  Comprobante de
                  {' '}
                  {selectedReceipt.patientName}
                </h3>

                <p
                  className="
                    mt-1
                    text-sm
                    text-[#6E7C72]
                  "
                >
                  Concepto:
                  {' '}
                  {selectedReceipt.paymentReference}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  () =>
                    setSelectedReceipt(
                      null,
                    )
                }
                className="
                  rounded-full
                  p-2
                  text-[#6E7C72]
                  hover:bg-[#FAF9F7]
                "
                aria-label="Cerrar comprobante"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>


            <div
              className="
                flex-1
                overflow-auto
                bg-[#F4F2EE]
                p-4
              "
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  selectedReceipt.paymentReceiptUrl
                }
                alt={`Comprobante de ${selectedReceipt.patientName}`}
                className="
                  mx-auto
                  max-h-[72vh]
                  max-w-full
                  rounded-lg
                  object-contain
                "
              />
            </div>
          </div>
        </div>
      )}


      {/* Modal de rechazo */}
      {appointmentToReject && (
        <div
          className="
            fixed
            inset-0
            z-[90]
            flex
            items-center
            justify-center
            bg-black/60
            p-4
          "
          onMouseDown={
            event => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeRejectModal();
              }
            }
          }
        >
          <div
            className="
              w-full
              max-w-md
              rounded-xl
              bg-white
              p-6
              shadow-2xl
            "
          >
            <h3
              className="
                text-lg
                font-bold
                text-[#2C3E34]
              "
            >
              Rechazar comprobante
            </h3>

            <p
              className="
                mt-2
                text-sm
                text-[#6E7C72]
              "
            >
              Escribe el motivo del rechazo para
              {' '}
              <strong>
                {appointmentToReject.patientName}
              </strong>
              .
            </p>


            <textarea
              value={
                rejectionNotes
              }
              onChange={
                event =>
                  setRejectionNotes(
                    event.target.value,
                  )
              }
              rows={4}
              maxLength={500}
              disabled={
                processingAppointmentId !==
                null
              }
              placeholder="Ejemplo: el monto no coincide o la imagen no permite verificar la transferencia."
              className="
                mt-4
                w-full
                resize-none
                rounded-lg
                border
                border-[#E6E3DE]
                px-3
                py-2
                text-sm
                outline-none
                focus:border-red-400
                focus:ring-2
                focus:ring-red-100
              "
            />


            <p
              className="
                mt-1
                text-right
                text-xs
                text-[#6E7C72]
              "
            >
              {rejectionNotes.length}/500
            </p>


            <div
              className="
                mt-5
                flex
                justify-end
                gap-3
              "
            >
              <button
                type="button"
                onClick={
                  closeRejectModal
                }
                disabled={
                  processingAppointmentId !==
                  null
                }
                className="
                  rounded-lg
                  border
                  border-[#E6E3DE]
                  px-4
                  py-2
                  text-sm
                  text-[#6E7C72]
                  hover:bg-[#FAF9F7]
                  disabled:opacity-50
                "
              >
                Cancelar
              </button>


              <button
                type="button"
                onClick={
                  handleReject
                }
                disabled={
                  processingAppointmentId !==
                    null ||
                  rejectionNotes.trim().length <
                    5
                }
                className="
                  rounded-lg
                  bg-red-600
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-red-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {processingAppointmentId !==
                null
                  ? 'Rechazando...'
                  : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}