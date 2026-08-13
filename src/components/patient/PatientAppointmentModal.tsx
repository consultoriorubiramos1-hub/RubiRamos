'use client';

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { toast } from 'react-hot-toast';

import TimeSlotPicker from './TimeSlotPicker';


interface PatientAppointmentModalProps {
  isOpen: boolean;

  onClose: () => void;

  onSuccess: () => void;

  selectedDate: Date | null;

  patientId: number;

  depositAmount: number;
}


/*
 * IMPORTANTE:
 * Reemplaza estos datos por los datos bancarios
 * reales de la nutrióloga.
 */
const BANK_DETAILS = {
  accountHolder:
    'RUBI RAMOS ALVAREZ',

  bank:
    'BBVA BANCOMER',

  accountNumber:
    '4152314617155166',

  clabe:
    'CLABE DE 18 DÍGITOS',
};


const MAX_RECEIPT_SIZE =
  5 * 1024 * 1024;


const ALLOWED_RECEIPT_TYPES =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);


/**
 * Obtiene YYYY-MM-DD sin modificar la fecha
 * por diferencias de zona horaria.
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
 * Genera el mismo concepto que utilizará
 * la acción del servidor.
 */
function createPaymentReference(
  patientId: number,
  appointmentDate: Date,
  selectedTime: string | null,
): string {
  if (!selectedTime) {
    return 'Selecciona un horario';
  }

  const compactDate =
    formatLocalDate(
      appointmentDate,
    ).replace(
      /-/g,
      '',
    );

  const compactTime =
    selectedTime
      .replace(
        /:/g,
        '',
      )
      .slice(
        0,
        4,
      );

  return (
    `RUBI-${patientId}-${compactDate}-${compactTime}`
  );
}


function formatFileSize(
  bytes: number,
): string {
  if (
    bytes < 1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return (
      `${(
        bytes / 1024
      ).toFixed(1)} KB`
    );
  }

  return (
    `${(
      bytes /
      (
        1024 * 1024
      )
    ).toFixed(1)} MB`
  );
}


export default function PatientAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  selectedDate,
  patientId,
  depositAmount,
}: PatientAppointmentModalProps) {
  const [
    selectedTime,
    setSelectedTime,
  ] =
    useState<string | null>(
      null,
    );

  const [
    notes,
    setNotes,
  ] =
    useState('');

  const [
    receiptFile,
    setReceiptFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    receiptPreview,
    setReceiptPreview,
  ] =
    useState<string | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );


  const paymentReference =
    useMemo(
      () => {
        if (
          !selectedDate
        ) {
          return '';
        }

        return createPaymentReference(
          patientId,
          selectedDate,
          selectedTime,
        );
      },
      [
        patientId,
        selectedDate,
        selectedTime,
      ],
    );


  useEffect(
    () => {
      if (
        !receiptFile
      ) {
        setReceiptPreview(
          null,
        );

        return;
      }

      const previewUrl =
        URL.createObjectURL(
          receiptFile,
        );

      setReceiptPreview(
        previewUrl,
      );

      return () => {
        URL.revokeObjectURL(
          previewUrl,
        );
      };
    },
    [
      receiptFile,
    ],
  );


  useEffect(
    () => {
      if (
        !isOpen
      ) {
        setSelectedTime(
          null,
        );

        setNotes(
          '',
        );

        setReceiptFile(
          null,
        );

        setReceiptPreview(
          null,
        );

        setLoading(
          false,
        );

        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            '';
        }
      }
    },
    [
      isOpen,
    ],
  );


  if (
    !isOpen ||
    !selectedDate
  ) {
    return null;
  }


  const formattedSelectedDate =
    selectedDate.toLocaleDateString(
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
    );


  const copyToClipboard =
    async (
      value: string,
      label: string,
    ) => {
      try {
        await navigator.clipboard.writeText(
          value,
        );

        toast.success(
          `${label} copiado`,
        );
      } catch {
        toast.error(
          `No se pudo copiar ${label.toLowerCase()}`,
        );
      }
    };


  const handleReceiptChange = (
    event:
      ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (
      !selectedFile
    ) {
      setReceiptFile(
        null,
      );

      return;
    }


    if (
      !ALLOWED_RECEIPT_TYPES.has(
        selectedFile.type,
      )
    ) {
      toast.error(
        'El comprobante debe ser una imagen JPG, PNG o WEBP.',
      );

      event.target.value =
        '';

      setReceiptFile(
        null,
      );

      return;
    }


    if (
      selectedFile.size >
      MAX_RECEIPT_SIZE
    ) {
      toast.error(
        'El comprobante no puede superar los 5 MB.',
      );

      event.target.value =
        '';

      setReceiptFile(
        null,
      );

      return;
    }


    setReceiptFile(
      selectedFile,
    );
  };


  const removeReceipt = () => {
    setReceiptFile(
      null,
    );

    setReceiptPreview(
      null,
    );

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        '';
    }
  };


  const handleClose = () => {
    if (
      loading
    ) {
      return;
    }

    onClose();
  };


  const handleSubmit =
    async () => {
      if (
        !selectedTime
      ) {
        toast.error(
          'Selecciona un horario.',
        );

        return;
      }


      if (
        !receiptFile
      ) {
        toast.error(
          'Debes adjuntar el comprobante del anticipo.',
        );

        return;
      }


      setLoading(
        true,
      );


      try {
        const {
          createPatientAppointment,
        } =
          await import(
            '@/lib/patient-appointments-actions'
          );


        const formData =
          new FormData();


        formData.append(
          'patientId',
          String(
            patientId,
          ),
        );

        formData.append(
          'appointmentDate',
          formatLocalDate(
            selectedDate,
          ),
        );

        formData.append(
          'startTime',
          selectedTime,
        );

        formData.append(
          'notes',
          notes.trim(),
        );

        formData.append(
          'receipt',
          receiptFile,
        );


        const result =
          await createPatientAppointment(
            formData,
          );


        if (
          !result.success
        ) {
          throw new Error(
            result.message ||
            'No se pudo enviar la solicitud de cita.',
          );
        }


        toast.success(
          result.message ||
          'Comprobante enviado correctamente.',
          {
            duration:
              6000,
          },
        );


        setSelectedTime(
          null,
        );

        setNotes(
          '',
        );

        setReceiptFile(
          null,
        );

        setReceiptPreview(
          null,
        );


        if (
          fileInputRef.current
        ) {
          fileInputRef.current.value =
            '';
        }


        onSuccess();

        onClose();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'No se pudo enviar la solicitud de cita.',
          {
            duration:
              5000,
          },
        );
      } finally {
        setLoading(
          false,
        );
      }
    };


  return (
    <div
      className="
        fixed
        inset-0
        z-[60]
        flex
        items-center
        justify-center
        bg-black/50
        p-4
      "
      onMouseDown={
        event => {
          if (
            event.target ===
            event.currentTarget
          ) {
            handleClose();
          }
        }
      }
    >
      <div
        className="
          flex
          max-h-[92vh]
          w-full
          max-w-2xl
          flex-col
          overflow-hidden
          rounded-xl
          border
          border-[#E6E3DE]
          bg-white
          shadow-xl
        "
      >
        {/* Encabezado */}
        <div
          className="
            flex
            items-start
            justify-between
            border-b
            border-[#E6E3DE]
            bg-[#FAF9F7]
            px-6
            py-4
          "
        >
          <div>
            <h3
              className="
                text-lg
                font-bold
                text-[#6B8E7B]
              "
            >
              Solicitar nueva cita
            </h3>

            <p
              className="
                mt-1
                text-xs
                text-[#6E7C72]
              "
            >
              La cita será confirmada después de revisar el comprobante.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              loading
            }
            className="
              rounded-full
              p-2
              text-[#6E7C72]
              transition-colors
              hover:bg-[#E6E3DE]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label="Cerrar"
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
            overflow-y-auto
            px-6
            py-5
          "
        >
          {/* Fecha */}
          <div className="mb-5">
            <p
              className="
                text-sm
                font-semibold
                text-[#2C3E34]
              "
            >
              Fecha de la cita
            </p>

            <p
              className="
                mt-1
                capitalize
                text-sm
                text-[#6E7C72]
              "
            >
              {formattedSelectedDate}
            </p>
          </div>


          {/* Horarios */}
          <div className="mb-5">
            <label
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-[#2C3E34]
              "
            >
              Selecciona un horario
            </label>

            <TimeSlotPicker
              date={
                selectedDate
              }
              patientId={
                patientId
              }
              onSelectSlot={
                setSelectedTime
              }
              selectedTime={
                selectedTime
              }
            />
          </div>


          {/* Ticket bancario */}
          <div
            className="
              mb-5
              overflow-hidden
              rounded-xl
              border
              border-[#BD7D4A]/30
              bg-[#FFFDF9]
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                bg-[#BD7D4A]
                px-4
                py-3
                text-white
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-white/80
                  "
                >
                  Ticket de anticipo
                </p>

                <p
                  className="
                    text-lg
                    font-bold
                  "
                >
                  ${Number(
                    depositAmount,
                  ).toFixed(2)} MXN
                </p>
              </div>

              <svg
                className="
                  h-8
                  w-8
                  text-white/90
                "
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm3 8h2"
                />
              </svg>
            </div>


            <div
              className="
                space-y-3
                p-4
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    text-[#6E7C72]
                  "
                >
                  Beneficiario
                </p>

                <p
                  className="
                    text-sm
                    font-semibold
                    text-[#2C3E34]
                  "
                >
                  {BANK_DETAILS.accountHolder}
                </p>
              </div>


              <div>
                <p
                  className="
                    text-xs
                    text-[#6E7C72]
                  "
                >
                  Banco
                </p>

                <p
                  className="
                    text-sm
                    font-semibold
                    text-[#2C3E34]
                  "
                >
                  {BANK_DETAILS.bank}
                </p>
              </div>


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
                    Número de cuenta
                  </p>

                  <div
                    className="
                      mt-1
                      flex
                      items-center
                      justify-between
                      gap-2
                      rounded-lg
                      bg-[#FAF9F7]
                      px-3
                      py-2
                    "
                  >
                    <span
                      className="
                        break-all
                        text-sm
                        font-semibold
                        text-[#2C3E34]
                      "
                    >
                      {BANK_DETAILS.accountNumber}
                    </span>

                    <button
                      type="button"
                      onClick={
                        () =>
                          copyToClipboard(
                            BANK_DETAILS.accountNumber,
                            'Número de cuenta',
                          )
                      }
                      className="
                        shrink-0
                        text-xs
                        font-semibold
                        text-[#6B8E7B]
                        hover:underline
                      "
                    >
                      Copiar
                    </button>
                  </div>
                </div>


                <div>
                  <p
                    className="
                      text-xs
                      text-[#6E7C72]
                    "
                  >
                    CLABE
                  </p>

                  <div
                    className="
                      mt-1
                      flex
                      items-center
                      justify-between
                      gap-2
                      rounded-lg
                      bg-[#FAF9F7]
                      px-3
                      py-2
                    "
                  >
                    <span
                      className="
                        break-all
                        text-sm
                        font-semibold
                        text-[#2C3E34]
                      "
                    >
                      {BANK_DETAILS.clabe}
                    </span>

                    <button
                      type="button"
                      onClick={
                        () =>
                          copyToClipboard(
                            BANK_DETAILS.clabe,
                            'CLABE',
                          )
                      }
                      className="
                        shrink-0
                        text-xs
                        font-semibold
                        text-[#6B8E7B]
                        hover:underline
                      "
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>


              <div>
                <p
                  className="
                    text-xs
                    text-[#6E7C72]
                  "
                >
                  Concepto obligatorio
                </p>

                <div
                  className="
                    mt-1
                    flex
                    items-center
                    justify-between
                    gap-2
                    rounded-lg
                    border
                    border-dashed
                    border-[#BD7D4A]/50
                    bg-[#BD7D4A]/10
                    px-3
                    py-2.5
                  "
                >
                  <span
                    className="
                      break-all
                      text-sm
                      font-bold
                      text-[#87532C]
                    "
                  >
                    {paymentReference}
                  </span>

                  {selectedTime && (
                    <button
                      type="button"
                      onClick={
                        () =>
                          copyToClipboard(
                            paymentReference,
                            'Concepto',
                          )
                      }
                      className="
                        shrink-0
                        text-xs
                        font-semibold
                        text-[#BD7D4A]
                        hover:underline
                      "
                    >
                      Copiar
                    </button>
                  )}
                </div>
              </div>


              <div
                className="
                  rounded-lg
                  border-l-4
                  border-[#BD7D4A]
                  bg-[#FAF9F7]
                  p-3
                "
              >
                <p
                  className="
                    text-xs
                    leading-relaxed
                    text-[#6E7C72]
                  "
                >
                  Realiza la transferencia por el monto exacto y utiliza el
                  concepto indicado. Después adjunta una captura clara del
                  comprobante.
                </p>
              </div>
            </div>
          </div>


          {/* Comprobante */}
          <div className="mb-5">
            <label
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-[#2C3E34]
              "
            >
              Comprobante de pago
              <span className="text-red-500">
                {' '}*
              </span>
            </label>


            {!receiptFile ? (
              <label
                className="
                  flex
                  cursor-pointer
                  flex-col
                  items-center
                  justify-center
                  rounded-xl
                  border-2
                  border-dashed
                  border-[#6B8E7B]/40
                  bg-[#6B8E7B]/5
                  px-4
                  py-8
                  text-center
                  transition-colors
                  hover:border-[#6B8E7B]
                  hover:bg-[#6B8E7B]/10
                "
              >
                <svg
                  className="
                    mb-3
                    h-9
                    w-9
                    text-[#6B8E7B]
                  "
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>

                <span
                  className="
                    text-sm
                    font-semibold
                    text-[#2C3E34]
                  "
                >
                  Seleccionar comprobante
                </span>

                <span
                  className="
                    mt-1
                    text-xs
                    text-[#6E7C72]
                  "
                >
                  JPG, PNG o WEBP · máximo 5 MB
                </span>

                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  accept="
                    image/jpeg,
                    image/png,
                    image/webp
                  "
                  onChange={
                    handleReceiptChange
                  }
                  disabled={
                    loading
                  }
                  className="hidden"
                />
              </label>
            ) : (
              <div
                className="
                  overflow-hidden
                  rounded-xl
                  border
                  border-[#E6E3DE]
                "
              >
                {receiptPreview && (
                  <div
                    className="
                      flex
                      max-h-64
                      items-center
                      justify-center
                      overflow-hidden
                      bg-[#FAF9F7]
                    "
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        receiptPreview
                      }
                      alt="Vista previa del comprobante"
                      className="
                        max-h-64
                        w-full
                        object-contain
                      "
                    />
                  </div>
                )}

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    border-t
                    border-[#E6E3DE]
                    p-3
                  "
                >
                  <div
                    className="
                      min-w-0
                    "
                  >
                    <p
                      className="
                        truncate
                        text-sm
                        font-semibold
                        text-[#2C3E34]
                      "
                    >
                      {receiptFile.name}
                    </p>

                    <p
                      className="
                        text-xs
                        text-[#6E7C72]
                      "
                    >
                      {formatFileSize(
                        receiptFile.size,
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      removeReceipt
                    }
                    disabled={
                      loading
                    }
                    className="
                      shrink-0
                      rounded-lg
                      border
                      border-red-200
                      px-3
                      py-1.5
                      text-xs
                      font-semibold
                      text-red-600
                      hover:bg-red-50
                      disabled:opacity-50
                    "
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>


          {/* Notas */}
          <div className="mb-5">
            <label
              className="
                mb-2
                block
                text-sm
                font-semibold
                text-[#2C3E34]
              "
            >
              Notas adicionales
              <span
                className="
                  font-normal
                  text-[#6E7C72]
                "
              >
                {' '}(opcional)
              </span>
            </label>

            <textarea
              value={
                notes
              }
              onChange={
                event =>
                  setNotes(
                    event.target.value,
                  )
              }
              rows={3}
              maxLength={500}
              disabled={
                loading
              }
              className="
                w-full
                resize-none
                rounded-lg
                border
                border-[#E6E3DE]
                px-3
                py-2
                text-[#2C3E34]
                outline-none
                transition-colors
                focus:border-[#6B8E7B]
                focus:ring-2
                focus:ring-[#6B8E7B]/10
                disabled:bg-gray-100
              "
              placeholder="Escribe alguna indicación para la nutrióloga..."
            />

            <p
              className="
                mt-1
                text-right
                text-xs
                text-[#6E7C72]
              "
            >
              {notes.length}/500
            </p>
          </div>


          {/* Aviso */}
          <div
            className="
              rounded-lg
              border
              border-[#A8CF45]/30
              bg-[#A8CF45]/10
              p-3
            "
          >
            <div
              className="
                flex
                items-start
                gap-2
              "
            >
              <svg
                className="
                  mt-0.5
                  h-5
                  w-5
                  shrink-0
                  text-[#6B8E7B]
                "
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

              <p
                className="
                  text-xs
                  leading-relaxed
                  text-[#4A6B59]
                "
              >
                El horario quedará reservado mientras la nutrióloga revisa el
                comprobante. La cita no estará confirmada hasta que el pago sea
                aprobado.
              </p>
            </div>
          </div>
        </div>


        {/* Acciones */}
        <div
          className="
            flex
            flex-col-reverse
            gap-3
            border-t
            border-[#E6E3DE]
            bg-white
            px-6
            py-4
            sm:flex-row
            sm:justify-end
          "
        >
          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              loading
            }
            className="
              rounded-lg
              border
              border-[#E6E3DE]
              px-4
              py-2.5
              text-[#6E7C72]
              transition-colors
              hover:bg-[#FAF9F7]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={
              handleSubmit
            }
            disabled={
              loading ||
              !selectedTime ||
              !receiptFile
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-[#BD7D4A]
              px-5
              py-2.5
              font-semibold
              text-white
              transition-colors
              hover:bg-[#F58634]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loading ? (
              <>
                <svg
                  className="
                    h-4
                    w-4
                    animate-spin
                  "
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />

                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>

                Enviando comprobante...
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

                Enviar comprobante y solicitar cita
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}