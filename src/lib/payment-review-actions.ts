'use server';

import postgres from 'postgres';
import { revalidatePath } from 'next/cache';


const sql = postgres(
  process.env.POSTGRES_URL!,
  {
    ssl: 'require',
  },
);


export interface PendingPaymentAppointment {
  id: number;

  patientId: number;

  patientName: string;

  phone: string;

  email: string;

  appointmentDate: string;

  startTime: string;

  endTime: string;

  depositAmount: number;

  paymentStatus: string;

  paymentReference: string;

  paymentReceiptUrl: string;

  paymentSubmittedAt:
    | string
    | null;

  notes:
    | string
    | null;
}


interface ReviewPaymentResult {
  success: boolean;

  message: string;
}


// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function normalizeDatabaseDate(
  value: unknown,
): string {
  if (
    value instanceof Date
  ) {
    return value
      .toISOString()
      .slice(
        0,
        10,
      );
  }

  const stringValue =
    String(
      value ?? '',
    );

  const match =
    stringValue.match(
      /^\d{4}-\d{2}-\d{2}/,
    );

  return (
    match?.[0] ||
    stringValue
  );
}


function normalizeDatabaseDateTime(
  value: unknown,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  return String(
    value,
  );
}


function buildPatientName(
  firstName: unknown,
  secondName: unknown,
  firstLastname: unknown,
  secondLastname: unknown,
): string {
  return [
    firstName,
    secondName,
    firstLastname,
    secondLastname,
  ]
    .filter(
      value =>
        typeof value ===
          'string' &&
        value.trim().length > 0,
    )
    .join(' ')
    .replace(
      /\s+/g,
      ' ',
    )
    .trim();
}


function revalidatePaymentPages() {
  const paths = [
    '/admin',
    '/admin/appointments',
    '/admin/calendar',
    '/calendar',
    '/admin/patient/calendar',
    '/patient/calendar',
  ];

  paths.forEach(
    path => {
      revalidatePath(
        path,
      );
    },
  );
}


// ============================================================
// OBTENER COMPROBANTES PENDIENTES
// ============================================================

export async function getPendingPaymentAppointments():
Promise<PendingPaymentAppointment[]> {
  try {
    const appointments =
      await sql`
        SELECT
          a.id,

          a.patient_id,

          a.appointment_date,

          a.start_time,

          a.end_time,

          a.deposit_amount,

          a.notes,

          a.payment_status,

          a.payment_reference,

          a.payment_receipt_url,

          a.payment_submitted_at,

          p.first_name,

          p.second_name,

          p.first_lastname,

          p.second_lastname,

          p.phone,

          u.email

        FROM tblappointments a

        INNER JOIN tblpatients p
          ON p.id =
            a.patient_id

        INNER JOIN tblusers u
          ON u.id =
            p.user_id

        WHERE a.status =
          'pending_payment'

          AND a.payment_status =
            'submitted'

          AND a.payment_receipt_url
            IS NOT NULL

        ORDER BY
          a.payment_submitted_at ASC,

          a.appointment_date ASC,

          a.start_time ASC
      `;


    return appointments.map(
      appointment => ({
        id:
          Number(
            appointment.id,
          ),

        patientId:
          Number(
            appointment.patient_id,
          ),

        patientName:
          buildPatientName(
            appointment.first_name,
            appointment.second_name,
            appointment.first_lastname,
            appointment.second_lastname,
          ),

        phone:
          String(
            appointment.phone ??
            '',
          ),

        email:
          String(
            appointment.email ??
            '',
          ),

        appointmentDate:
          normalizeDatabaseDate(
            appointment
              .appointment_date,
          ),

        startTime:
          String(
            appointment.start_time,
          ).slice(
            0,
            5,
          ),

        endTime:
          String(
            appointment.end_time,
          ).slice(
            0,
            5,
          ),

        depositAmount:
          Number(
            appointment.deposit_amount ??
            0,
          ),

        paymentStatus:
          String(
            appointment.payment_status,
          ),

        paymentReference:
          String(
            appointment.payment_reference ??
            '',
          ),

        paymentReceiptUrl:
          String(
            appointment.payment_receipt_url,
          ),

        paymentSubmittedAt:
          normalizeDatabaseDateTime(
            appointment
              .payment_submitted_at,
          ),

        notes:
          appointment.notes
            ? String(
                appointment.notes,
              )
            : null,
      }),
    );
  } catch (error) {
    console.error(
      'Error al obtener comprobantes pendientes:',
      error,
    );

    return [];
  }
}


// ============================================================
// APROBAR COMPROBANTE
// ============================================================

export async function approvePaymentReceipt(
  appointmentId: number,
): Promise<ReviewPaymentResult> {
  try {
    if (
      !Number.isInteger(
        appointmentId,
      ) ||
      appointmentId <= 0
    ) {
      return {
        success:
          false,

        message:
          'El identificador de la cita no es válido.',
      };
    }


    const result =
      await sql.begin(
        async transaction => {
          const [
            appointment,
          ] =
            await transaction`
              SELECT
                id,
                status,
                payment_status,
                payment_receipt_url,
                deposit_amount

              FROM tblappointments

              WHERE id =
                ${appointmentId}

              FOR UPDATE
            `;


          if (
            !appointment
          ) {
            return {
              success:
                false,

              message:
                'La solicitud de cita no existe.',
            };
          }


          if (
            appointment
              .payment_status ===
                'approved' &&
            appointment.status ===
                'scheduled'
          ) {
            return {
              success:
                true,

              message:
                'El comprobante ya había sido aprobado.',
            };
          }


          if (
            appointment.status !==
              'pending_payment' ||
            appointment
              .payment_status !==
              'submitted'
          ) {
            return {
              success:
                false,

              message:
                'La solicitud ya fue revisada o cambió de estado.',
            };
          }


          if (
            !appointment
              .payment_receipt_url
          ) {
            return {
              success:
                false,

              message:
                'La cita no tiene un comprobante adjunto.',
            };
          }


          await transaction`
            UPDATE tblappointments

            SET
              status =
                'scheduled',

              deposit_paid =
                TRUE,

              payment_status =
                'approved',

              payment_reviewed_at =
                NOW(),

              payment_review_notes =
                'Comprobante aprobado por la nutrióloga.',

              updated_at =
                NOW()

            WHERE id =
              ${appointmentId}
          `;


          return {
            success:
              true,

            message:
              'El comprobante fue aprobado y la cita quedó confirmada.',
          };
        },
      );


    if (
      result.success
    ) {
      revalidatePaymentPages();
    }


    return result;
  } catch (error) {
    console.error(
      'Error al aprobar el comprobante:',
      error,
    );

    return {
      success:
        false,

      message:
        error instanceof Error
          ? error.message
          : 'No se pudo aprobar el comprobante.',
    };
  }
}


// ============================================================
// RECHAZAR COMPROBANTE
// ============================================================

export async function rejectPaymentReceipt(
  appointmentId: number,
  reviewNotes: string,
): Promise<ReviewPaymentResult> {
  try {
    if (
      !Number.isInteger(
        appointmentId,
      ) ||
      appointmentId <= 0
    ) {
      return {
        success:
          false,

        message:
          'El identificador de la cita no es válido.',
      };
    }


    const normalizedNotes =
      reviewNotes
        .trim()
        .slice(
          0,
          500,
        );


    if (
      normalizedNotes.length <
      5
    ) {
      return {
        success:
          false,

        message:
          'Escribe el motivo por el que se rechazó el comprobante.',
      };
    }


    const result =
      await sql.begin(
        async transaction => {
          const [
            appointment,
          ] =
            await transaction`
              SELECT
                id,
                status,
                payment_status

              FROM tblappointments

              WHERE id =
                ${appointmentId}

              FOR UPDATE
            `;


          if (
            !appointment
          ) {
            return {
              success:
                false,

              message:
                'La solicitud de cita no existe.',
            };
          }


          if (
            appointment
              .payment_status ===
                'rejected'
          ) {
            return {
              success:
                true,

              message:
                'El comprobante ya había sido rechazado.',
            };
          }


          if (
            appointment.status !==
              'pending_payment' ||
            appointment
              .payment_status !==
              'submitted'
          ) {
            return {
              success:
                false,

              message:
                'La solicitud ya fue revisada o cambió de estado.',
            };
          }


          await transaction`
            UPDATE tblappointments

            SET
              status =
                'cancelled',

              deposit_paid =
                FALSE,

              payment_status =
                'rejected',

              payment_reviewed_at =
                NOW(),

              payment_review_notes =
                ${normalizedNotes},

              updated_at =
                NOW()

            WHERE id =
              ${appointmentId}
          `;


          return {
            success:
              true,

            message:
              'El comprobante fue rechazado y el horario quedó disponible nuevamente.',
          };
        },
      );


    if (
      result.success
    ) {
      revalidatePaymentPages();
    }


    return result;
  } catch (error) {
    console.error(
      'Error al rechazar el comprobante:',
      error,
    );

    return {
      success:
        false,

      message:
        error instanceof Error
          ? error.message
          : 'No se pudo rechazar el comprobante.',
    };
  }
}