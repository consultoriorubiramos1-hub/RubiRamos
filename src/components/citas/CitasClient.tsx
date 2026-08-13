"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import ClinicalEvaluationModal from "./ClinicalEvaluationModal";
import { markAppointmentAsNoShow } from "@/lib/appointments-actions";

interface CitasClientProps {
  initialAppointments: any[];
}

export default function CitasClient({
  initialAppointments,
}: CitasClientProps) {
  const router = useRouter();

  const [selectedAppointment, setSelectedAppointment] =
    useState<any>(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [evaluationType, setEvaluationType] =
    useState<"initial" | "followup">("initial");

  const [
    updatingAppointmentId,
    setUpdatingAppointmentId,
  ] = useState<number | null>(null);

  const handleOpenEvaluation = (
    appointment: any,
    type: "initial" | "followup",
  ) => {
    if (appointment.status === "no_show") {
      toast.error(
        "Esta cita está registrada como inasistencia y no puede iniciar una consulta.",
      );

      return;
    }

    setSelectedAppointment(appointment);
    setEvaluationType(type);
    setModalOpen(true);
  };

  const handleEvaluationComplete = () => {
    setModalOpen(false);
    setSelectedAppointment(null);
    router.refresh();
  };

  /**
   * Marca una cita como inasistencia después de solicitar
   * confirmación a la nutrióloga.
   */
  const handleNoShow = async (appointment: any) => {
    const patientName =
      appointment.patient?.nombre_completo ||
      "el paciente";

    const confirmed = window.confirm(
      `¿Confirmas que ${patientName} no asistió a su cita?\n\n` +
        "Esta acción registrará la cita como inasistencia.",
    );

    if (!confirmed) {
      return;
    }

    setUpdatingAppointmentId(appointment.id);

    try {
      const result = await markAppointmentAsNoShow(
        appointment.id,
      );

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    } catch (error) {
      console.error(
        "Error al registrar la inasistencia:",
        error,
      );

      toast.error(
        "Ocurrió un error al actualizar la cita.",
      );
    } finally {
      setUpdatingAppointmentId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <span className="rounded-full bg-[#5A8C7A]/20 px-2 py-1 text-xs text-[#2C3E34]">
            Programada
          </span>
        );

      case "confirmed":
        return (
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
            Confirmada
          </span>
        );

      case "completed":
        return (
          <span className="rounded-full bg-[#A8CF45]/20 px-2 py-1 text-xs text-[#2C3E34]">
            Completada
          </span>
        );

      case "no_show":
        return (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
            No asistió
          </span>
        );

      case "cancelled":
        return (
          <span className="rounded-full bg-[#F58634]/20 px-2 py-1 text-xs text-[#2C3E34]">
            Cancelada
          </span>
        );

      default:
        return (
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
            {status}
          </span>
        );
    }
  };

  const getDepositBadge = (
    depositPaid: boolean,
    depositAmount: number,
  ) => {
    if (depositPaid) {
      return (
        <span className="rounded-full bg-[#A8CF45]/20 px-2 py-1 text-xs text-[#2C3E34]">
          Anticipo pagado (${depositAmount})
        </span>
      );
    }

    return (
      <span className="rounded-full bg-[#F58634]/20 px-2 py-1 text-xs text-[#2C3E34]">
        Anticipo pendiente (${depositAmount})
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {initialAppointments.length === 0 ? (
        <div className="rounded-xl border border-[#E6E3DE] bg-white p-8 text-center shadow-sm">
          <p className="text-[#6E7C72]">
            No hay citas programadas para hoy
          </p>
        </div>
      ) : (
        initialAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className={`overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md ${
              appointment.status === "completed"
                ? "border-2 border-[#A8CF45]"
                : appointment.status === "no_show"
                  ? "border-2 border-red-300"
                  : "border border-[#E6E3DE]"
            }`}
          >
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Información del paciente */}
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-[#2C3E34]">
                      {
                        appointment.patient
                          .nombre_completo
                      }
                    </h3>

                    {getStatusBadge(
                      appointment.status,
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 md:grid-cols-3">
                    <p className="text-[#6E7C72]">
                      <span className="font-medium text-[#2C3E34]">
                        Hora:
                      </span>{" "}
                      {appointment.start_time.slice(
                        0,
                        5,
                      )}{" "}
                      -{" "}
                      {appointment.end_time.slice(
                        0,
                        5,
                      )}
                    </p>

                    <p className="text-[#6E7C72]">
                      <span className="font-medium text-[#2C3E34]">
                        Edad:
                      </span>{" "}
                      {appointment.patient.age} años
                    </p>

                    <p className="text-[#6E7C72]">
                      <span className="font-medium text-[#2C3E34]">
                        Género:
                      </span>{" "}
                      {appointment.patient.gender ===
                      "M"
                        ? "Masculino"
                        : appointment.patient
                              .gender === "F"
                          ? "Femenino"
                          : "No especificado"}
                    </p>

                    <p className="text-[#6E7C72]">
                      <span className="font-medium text-[#2C3E34]">
                        Teléfono:
                      </span>{" "}
                      {appointment.patient.phone ||
                        "—"}
                    </p>

                    <p className="text-[#6E7C72] sm:col-span-2">
                      <span className="font-medium text-[#2C3E34]">
                        Email:
                      </span>{" "}
                      {appointment.patient.email}
                    </p>
                  </div>

                  <div className="mt-3">
                    {getDepositBadge(
                      appointment.deposit_paid,
                      appointment.deposit_amount,
                    )}
                  </div>

                  {appointment.notes && (
                    <p className="mt-2 text-sm text-[#6E7C72]">
                      <span className="font-medium text-[#2C3E34]">
                        Notas:
                      </span>{" "}
                      {appointment.notes}
                    </p>
                  )}
                </div>

                  {/* Botones de acción */}
                  <div className="flex flex-shrink-0 flex-col gap-2">
                    {appointment.status === "no_show" ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center">
                        <p className="text-sm font-semibold text-red-700">
                          Inasistencia registrada
                        </p>

                        <p className="mt-1 text-xs text-red-600">
                          Esta cita no puede iniciar una consulta.
                        </p>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenEvaluation(
                              appointment,
                              "initial",
                            )
                          }
                          className="rounded-lg bg-[#5A8C7A] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4A7C6A]"
                        >
                          {appointment.has_initial_evaluation
                            ? "Ver Evaluación Inicial"
                            : "Evaluación Inicial"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleOpenEvaluation(
                              appointment,
                              "followup",
                            )
                          }
                          className={`rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors ${
                            appointment.status === "completed"
                              ? "bg-[#5A8C7A] hover:bg-[#4A7C6A]"
                              : "bg-[#BD7D4A] hover:bg-[#F58634]"
                          }`}
                        >
                          {appointment.status === "completed"
                            ? "Ver Evaluación"
                            : "Iniciar Consulta"}
                        </button>

                        {(appointment.status === "scheduled" ||
                          appointment.status === "confirmed") && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleNoShow(appointment)
                              }
                              disabled={
                                updatingAppointmentId === appointment.id
                              }
                              className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updatingAppointmentId ===
                              appointment.id
                                ? "Actualizando..."
                                : "No asistió"}
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
              </div>
            </div>
          </div>
        ))
      )}

      <ClinicalEvaluationModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        evaluationType={evaluationType}
        onSuccess={handleEvaluationComplete}
      />
    </div>
  );
}