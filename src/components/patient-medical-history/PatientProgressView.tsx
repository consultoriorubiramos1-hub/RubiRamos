'use client';

interface PatientProgressViewProps {
  followUpEvaluations: any[];
}

export default function PatientProgressView({ followUpEvaluations }: PatientProgressViewProps) {
  const formatDate = (date: string | Date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatNumber = (value: number | string | null | undefined, decimals: number = 1) => {
    if (value === null || value === undefined) return '—';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '—';
    return numValue.toFixed(decimals);
  };

  if (followUpEvaluations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-8 text-center">
        <p className="text-[#6E7C72]">No hay registros de progreso para este paciente</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tabla de Resultados */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
        <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
          <h3 className="text-lg font-bold text-[#5A8C7A]">Resultados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E6E3DE]">
            <thead className="bg-[#FAF9F7]">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">FECHA</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">PESO</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">%GRASA</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">GRASA VISCERAL%</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">AGUA TOTAL%</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">MUSCULO%</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">CINTURA</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">PIERNA</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">CADERA</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">GLUTEO</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">BRAZO</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">CUELLO</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">P.B</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">P.A</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[#6E7C72]">T/A</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E6E3DE]">
              {followUpEvaluations.map((evaluation) => (
                <tr key={evaluation.id} className="hover:bg-[#FAF9F7]">
                  <td className="px-3 py-2 text-xs text-[#2C3E34] whitespace-nowrap">{formatDate(evaluation.evaluation_date)}</td>
                  <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evaluation.anthropometric?.weight)}</td>
                  <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evaluation.anthropometric?.body_fat_percentage)}</td>
                  <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evaluation.anthropometric?.visceral_fat_percentage)}</td>
                  <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evaluation.anthropometric?.total_water_percentage)}</td>
                  <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evaluation.anthropometric?.muscle_percentage)}</td>
                  <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evaluation.anthropometric?.waist_circumference)}</td>
                  <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evaluation.anthropometric?.leg_circumference)}</td>
                  <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evaluation.anthropometric?.hip_circumference)}</td>
                  <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evaluation.anthropometric?.gluteus_circumference)}</td>
                  <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evaluation.anthropometric?.arm_circumference)}</td>
                  <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evaluation.anthropometric?.neck_circumference)}</td>
                  <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evaluation.anthropometric?.biceps_skinfold_mm)}</td>
                  <td className="px-3 py-2 text-xs text-[#2C3E34]">{formatNumber(evaluation.anthropometric?.triceps_skinfold_mm)}</td>
                  <td className="px-3 py-2 text-xs text-[#2C3E34]">
                    {evaluation.anthropometric?.blood_pressure_systolic ? 
                      `${evaluation.anthropometric.blood_pressure_systolic}/${evaluation.anthropometric.blood_pressure_diastolic || '—'}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla de Medidas por Extremidad */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
        <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
          <h3 className="text-lg font-bold text-[#5A8C7A]">Medidas por Extremidad</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E6E3DE]">
            <thead className="bg-[#FAF9F7]">
              <tr>
                <th rowSpan={2} className="px-4 py-2 text-left text-xs font-semibold text-[#6E7C72] border-r border-[#E6E3DE]">Fecha</th>
                <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-[#6E7C72] border-r border-[#E6E3DE]">Brazo Derecho</th>
                <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-[#6E7C72] border-r border-[#E6E3DE]">Brazo Izquierdo</th>
                <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-[#6E7C72] border-r border-[#E6E3DE]">Pierna Derecha</th>
                <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-[#6E7C72] border-r border-[#E6E3DE]">Pierna Izquierda</th>
                <th colSpan={2} className="px-4 py-2 text-center text-xs font-semibold text-[#6E7C72]">Torso</th>
              </tr>
              <tr className="bg-[#FAF9F7]">
                <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Grasa</th>
                <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Músculo</th>
                <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Grasa</th>
                <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Músculo</th>
                <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Grasa</th>
                <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Músculo</th>
                <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Grasa</th>
                <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Músculo</th>
                <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72] border-r border-[#E6E3DE]">Grasa</th>
                <th className="px-3 py-1 text-center text-xs font-medium text-[#6E7C72]">Músculo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E6E3DE]">
              {followUpEvaluations.map((evaluation) => (
                <tr key={evaluation.id} className="hover:bg-[#FAF9F7]">
                  <td className="px-4 py-2 text-xs text-[#2C3E34] whitespace-nowrap border-r border-[#E6E3DE]">{formatDate(evaluation.evaluation_date)}</td>
                  <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evaluation.anthropometric?.right_arm_fat)}</td>
                  <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evaluation.anthropometric?.right_arm_muscle)}</td>
                  <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evaluation.anthropometric?.left_arm_fat)}</td>
                  <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evaluation.anthropometric?.left_arm_muscle)}</td>
                  <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evaluation.anthropometric?.right_leg_fat)}</td>
                  <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evaluation.anthropometric?.right_leg_muscle)}</td>
                  <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evaluation.anthropometric?.left_leg_fat)}</td>
                  <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evaluation.anthropometric?.left_leg_muscle)}</td>
                  <td className="px-3 py-2 text-center text-xs text-[#2C3E34] border-r border-[#E6E3DE]">{formatNumber(evaluation.anthropometric?.torso_fat)}</td>
                  <td className="px-3 py-2 text-center text-xs text-[#2C3E34]">{formatNumber(evaluation.anthropometric?.torso_muscle)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle de cada evaluación */}
      <div className="space-y-6">
        {followUpEvaluations.map((evaluation) => (
          <div key={evaluation.id} className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
            <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
              <div>
                <h3 className="text-lg font-bold text-[#5A8C7A]">Evaluación del {formatDate(evaluation.evaluation_date)} {evaluation.start_time ? `- ${evaluation.start_time.slice(0,5)}` : ''}</h3>
                {evaluation.status && (
                  <p className="text-xs text-[#6E7C72] mt-1">Estado: {evaluation.status === 'completed' ? 'Completada' : 'Programada'}</p>
                )}
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Parámetros Bioquímicos */}
              {evaluation.biochemical_params && (evaluation.biochemical_params.glucose !== null || evaluation.biochemical_params.insulin !== null || 
                evaluation.biochemical_params.total_cholesterol !== null || evaluation.biochemical_params.triglycerides !== null) && (
                <div>
                  <h4 className="font-semibold text-[#2C3E34] mb-2">Parámetros Bioquímicos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {evaluation.biochemical_params.glucose !== null && evaluation.biochemical_params.glucose !== undefined && 
                      <div><span className="font-medium">Glucosa:</span> {evaluation.biochemical_params.glucose}</div>}
                    {evaluation.biochemical_params.insulin !== null && evaluation.biochemical_params.insulin !== undefined && 
                      <div><span className="font-medium">Insulina:</span> {evaluation.biochemical_params.insulin}</div>}
                    {evaluation.biochemical_params.homa_ir !== null && evaluation.biochemical_params.homa_ir !== undefined && 
                      <div><span className="font-medium">HOMA-IR:</span> {evaluation.biochemical_params.homa_ir}</div>}
                    {evaluation.biochemical_params.total_cholesterol !== null && evaluation.biochemical_params.total_cholesterol !== undefined && 
                      <div><span className="font-medium">Colesterol Total:</span> {evaluation.biochemical_params.total_cholesterol}</div>}
                    {evaluation.biochemical_params.triglycerides !== null && evaluation.biochemical_params.triglycerides !== undefined && 
                      <div><span className="font-medium">Triglicéridos:</span> {evaluation.biochemical_params.triglycerides}</div>}
                    {evaluation.biochemical_params.hdl_cholesterol !== null && evaluation.biochemical_params.hdl_cholesterol !== undefined && 
                      <div><span className="font-medium">HDL:</span> {evaluation.biochemical_params.hdl_cholesterol}</div>}
                    {evaluation.biochemical_params.ldl_cholesterol !== null && evaluation.biochemical_params.ldl_cholesterol !== undefined && 
                      <div><span className="font-medium">LDL:</span> {evaluation.biochemical_params.ldl_cholesterol}</div>}
                    {evaluation.biochemical_params.tsh !== null && evaluation.biochemical_params.tsh !== undefined && 
                      <div><span className="font-medium">TSH:</span> {evaluation.biochemical_params.tsh}</div>}
                    {evaluation.biochemical_params.vitamin_d !== null && evaluation.biochemical_params.vitamin_d !== undefined && 
                      <div><span className="font-medium">Vitamina D:</span> {evaluation.biochemical_params.vitamin_d}</div>}
                  </div>
                  {evaluation.biochemical_params.other_params && (
                    <div className="mt-2"><span className="font-medium">Otros:</span> {evaluation.biochemical_params.other_params}</div>
                  )}
                </div>
              )}

              {/* Diagnóstico Nutricional */}
              {evaluation.nutritional_diagnosis?.diagnosis && (
                <div>
                  <h4 className="font-semibold text-[#2C3E34] mb-2">Diagnóstico Nutricional</h4>
                  <p className="text-sm text-[#6E7C72] bg-[#FAF9F7] p-3 rounded-lg">{evaluation.nutritional_diagnosis.diagnosis}</p>
                </div>
              )}

              {/* Plan de Intervención */}
              {evaluation.intervention_plan && (evaluation.intervention_plan.nutritional_goals || evaluation.intervention_plan.dietary_strategy || 
                evaluation.intervention_plan.specific_recommendations || evaluation.intervention_plan.supplementation) && (
                <div>
                  <h4 className="font-semibold text-[#2C3E34] mb-2">Plan de Intervención</h4>
                  <div className="space-y-2 text-sm">
                    {evaluation.intervention_plan.nutritional_goals && <div><span className="font-medium">Objetivos:</span> {evaluation.intervention_plan.nutritional_goals}</div>}
                    {evaluation.intervention_plan.dietary_strategy && <div><span className="font-medium">Estrategia:</span> {evaluation.intervention_plan.dietary_strategy}</div>}
                    {evaluation.intervention_plan.specific_recommendations && <div><span className="font-medium">Recomendaciones:</span> {evaluation.intervention_plan.specific_recommendations}</div>}
                    {evaluation.intervention_plan.supplementation && <div><span className="font-medium">Suplementación:</span> {evaluation.intervention_plan.supplementation}</div>}
                  </div>
                </div>
              )}

              {/* Seguimiento */}
              {evaluation.follow_up && (evaluation.follow_up.next_appointment_date || evaluation.follow_up.indicators_to_evaluate || evaluation.follow_up.observations) && (
                <div>
                  <h4 className="font-semibold text-[#2C3E34] mb-2">Seguimiento</h4>
                  <div className="space-y-1 text-sm">
                    {evaluation.follow_up.next_appointment_date && <div><span className="font-medium">Próxima cita:</span> {formatDate(evaluation.follow_up.next_appointment_date)}</div>}
                    {evaluation.follow_up.indicators_to_evaluate && <div><span className="font-medium">Indicadores:</span> {evaluation.follow_up.indicators_to_evaluate}</div>}
                    {evaluation.follow_up.observations && <div><span className="font-medium">Observaciones:</span> {evaluation.follow_up.observations}</div>}
                  </div>
                </div>
              )}

              {/* Si no hay datos adicionales */}
              {!evaluation.nutritional_diagnosis?.diagnosis && 
              !(evaluation.intervention_plan && (evaluation.intervention_plan.nutritional_goals || evaluation.intervention_plan.dietary_strategy)) && 
              !(evaluation.follow_up && (evaluation.follow_up.next_appointment_date || evaluation.follow_up.observations)) && (
                <p className="text-sm text-[#6E7C72] text-center py-4">No hay información adicional registrada para esta evaluación</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}