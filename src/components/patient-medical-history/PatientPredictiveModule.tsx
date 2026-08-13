'use client';

import { useState } from 'react';

interface PatientPredictiveModuleProps {
  weightHistory: any[];
  patient: any;
}

export default function PatientPredictiveModule({ weightHistory, patient }: PatientPredictiveModuleProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(1)} kg`;
  };

  const formatNumber = (value: number | null | undefined, decimals: number = 1) => {
    if (value === null || value === undefined) return '—';
    return value.toFixed(decimals);
  };

  // Ordenar historial de pesos de más antiguo a más reciente
  const sortedWeightHistory = [...weightHistory].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const initialWeight = sortedWeightHistory[0]?.weight;
  const currentWeight = sortedWeightHistory[sortedWeightHistory.length - 1]?.weight;
  const weightLost = initialWeight - currentWeight;
  const isLosingWeight = weightLost > 0;
  
  // Calcular el peso ideal usando la estatura del paciente
  const calculateIdealWeight = (heightCm: number | null): number | null => {
    if (!heightCm || heightCm <= 0) return null;
    const heightM = heightCm / 100;
    const idealBmi = 22;
    return idealBmi * (heightM * heightM);
  };
  
  const idealWeight = calculateIdealWeight(patient.height);
  
  // Calcular IMC actual
  const currentBmi = patient.height && currentWeight 
    ? (currentWeight / Math.pow(patient.height / 100, 2)).toFixed(1)
    : null;
  
  const bmiCategory = currentBmi 
    ? parseFloat(currentBmi) < 18.5 ? 'Bajo peso'
      : parseFloat(currentBmi) < 25 ? 'Normal'
      : parseFloat(currentBmi) < 30 ? 'Sobrepeso'
      : parseFloat(currentBmi) < 35 ? 'Obesidad Grado I'
      : parseFloat(currentBmi) < 40 ? 'Obesidad Grado II'
      : 'Obesidad Grado III'
    : 'No disponible';
  
  // Calcular progreso hacia el peso ideal
  const totalToLose = idealWeight ? initialWeight - idealWeight : null;
  const progressPercentage = totalToLose && totalToLose > 0 && weightLost > 0
    ? Math.min(Math.max((weightLost / totalToLose) * 100, 0), 100)
    : 0;
  
  const progressStatus = progressPercentage >= 75 ? 'Muy cerca de la meta'
    : progressPercentage >= 50 ? 'Buen progreso'
    : progressPercentage >= 25 ? 'Progreso moderado'
    : progressPercentage > 0 ? 'Iniciando el proceso'
    : weightLost > 0 ? 'Iniciando el proceso'
    : weightLost < 0 ? 'Aumento de peso detectado'
    : 'Sin cambios significativos';

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-[#A8CF45]';
    if (percentage >= 50) return 'bg-[#BD7D4A]';
    if (percentage >= 25) return 'bg-[#F58634]';
    return 'bg-[#5A8C7A]';
  };

  // Calcular la constante de decremento k usando la fórmula
  let k = null;
  let monthsToIdeal = null;
  let predictions = [];
  let trend = 'Sin datos suficientes';

  if (sortedWeightHistory.length >= 2 && isLosingWeight) {
    // Calcular k usando el primer y último registro
    const firstDate = new Date(sortedWeightHistory[0].date);
    const lastDate = new Date(sortedWeightHistory[sortedWeightHistory.length - 1].date);
    const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + 
                       (lastDate.getMonth() - firstDate.getMonth());
    
    if (monthsDiff > 0) {
      k = Math.log(currentWeight / initialWeight) / monthsDiff;
      
      // Calcular meses para alcanzar peso ideal
      if (idealWeight && idealWeight < currentWeight && k < 0) {
        monthsToIdeal = Math.log(idealWeight / currentWeight) / k;
        monthsToIdeal = Math.ceil(Math.max(monthsToIdeal, 0));
      }
      
      // Generar predicciones
      for (let i = 1; i <= 6; i++) {
        const predictedWeight = currentWeight * Math.exp(k * i);
        const predictionDate = new Date(lastDate);
        predictionDate.setMonth(predictionDate.getMonth() + i);
        predictions.push({
          month: i,
          date: predictionDate,
          weight: Math.max(predictedWeight, 40),
          isIdeal: idealWeight ? predictedWeight <= idealWeight : false
        });
      }
    }
  }

  // Determinar la tendencia
  if (k !== null) {
    trend = k < -0.05 ? 'Pérdida acelerada'
      : k < -0.02 ? 'Pérdida moderada'
      : k < 0 ? 'Pérdida lenta'
      : k > 0 ? 'Aumento de peso'
      : 'Pérdida constante';
  }

  if (sortedWeightHistory.length < 2) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-8 text-center">
        <p className="text-[#6E7C72]">No hay suficientes datos para realizar predicciones.</p>
        <p className="text-sm text-[#6E7C72] mt-2">Se necesitan al menos 2 registros de peso para calcular el modelo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjeta de resumen */}
      <div className="bg-gradient-to-r from-[#5A8C7A] to-[#4A7C6A] rounded-xl shadow-sm p-6 text-white">
        <h3 className="text-lg font-bold mb-4">Resumen del Progreso</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm opacity-90">Peso inicial</p>
            <p className="text-2xl font-bold">{formatWeight(initialWeight)}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Peso actual</p>
            <p className="text-2xl font-bold">{formatWeight(currentWeight)}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Peso perdido</p>
            <p className={`text-2xl font-bold ${weightLost > 0 ? 'text-[#A8CF45]' : 'text-[#F58634]'}`}>
              {weightLost > 0 ? formatWeight(weightLost) : formatWeight(Math.abs(weightLost))}
              {weightLost < 0 && ' (aumento)'}
            </p>
          </div>
          {idealWeight && (
            <div>
              <p className="text-sm opacity-90">Peso ideal</p>
              <p className="text-2xl font-bold">{idealWeight.toFixed(1)} kg</p>
            </div>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-[#2C3E34]">Progreso hacia la meta</h4>
          <span className="text-sm font-bold text-[#5A8C7A]">{progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-[#E6E3DE] rounded-full h-3">
          <div 
            className={`${getProgressColor(progressPercentage)} h-3 rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
        <p className="text-sm text-[#6E7C72] mt-2">{progressStatus}</p>
      </div>

      {/* IMC y métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-6">
          <h4 className="font-semibold text-[#5A8C7A] mb-3">Índice de Masa Corporal (IMC)</h4>
          {patient.height ? (
            <>
              <p className="text-3xl font-bold text-[#2C3E34]">{currentBmi}</p>
              <p className={`text-sm mt-1 ${
                currentBmi && parseFloat(currentBmi) < 25 ? 'text-[#A8CF45]' : 'text-[#F58634]'
              }`}>
                {bmiCategory}
              </p>
              <div className="mt-3 pt-3 border-t border-[#E6E3DE] text-xs text-[#6E7C72] space-y-1">
                <p><strong>Fórmula:</strong> IMC = Peso / (Estatura)²</p>
                <p><strong>Cálculo:</strong> {currentWeight} / ({patient.height / 100})² = {currentBmi}</p>
              </div>
            </>
          ) : (
            <p className="text-[#6E7C72]">Registre la estatura para calcular el IMC</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-6">
          <h4 className="font-semibold text-[#5A8C7A] mb-3">Modelo Matemático</h4>
          <p className="text-sm text-[#6E7C72] mb-2">Tasa de decremento mensual (k):</p>
          <p className="text-2xl font-mono font-bold text-[#2C3E34]">
            {k !== null ? k.toFixed(4) : 'No disponible'}
          </p>
          <p className="text-xs text-[#6E7C72] mt-1">
            Tendencia: {trend}
          </p>
        </div>
      </div>

      {/* Cálculo del Peso Ideal */}
      {patient.height && idealWeight && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] p-6">
          <h4 className="font-semibold text-[#5A8C7A] mb-3">Determinación del Peso Objetivo</h4>
          <div className="space-y-3 text-sm text-[#2C3E34]">
            <p><strong>Fórmula:</strong> Peso Objetivo = IMC ideal × (Estatura en metros)²</p>
            <p><strong>IMC ideal:</strong> 22 (valor dentro del rango saludable 18.5 - 24.9)</p>
            <p><strong>Estatura:</strong> {patient.height} cm = {patient.height / 100} m</p>
            <div className="bg-[#FAF9F7] p-3 rounded-lg">
              <p className="font-mono">Peso Objetivo = 22 × ({patient.height / 100})²</p>
              <p className="font-mono mt-1">Peso Objetivo = 22 × {Math.pow(patient.height / 100, 2).toFixed(4)}</p>
              <p className="font-mono font-bold text-[#5A8C7A] mt-1">Peso Objetivo = {idealWeight.toFixed(2)} kg</p>
            </div>
          </div>
        </div>
      )}

      {/* Tiempo estimado para peso ideal */}
      {monthsToIdeal && monthsToIdeal > 0 && (
        <div className="bg-[#FAF9F7] rounded-xl shadow-sm border border-[#E6E3DE] p-6">
          <h4 className="font-semibold text-[#5A8C7A] mb-2">Tiempo estimado para alcanzar el peso ideal</h4>
          <p className="text-3xl font-bold text-[#2C3E34]">{monthsToIdeal} meses</p>
          <p className="text-sm text-[#6E7C72] mt-2">
            Basado en el ritmo actual de pérdida de peso. Este tiempo puede variar según la constancia.
          </p>
        </div>
      )}

      {/* Predicciones */}
      {predictions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
          <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
            <h3 className="text-lg font-bold text-[#5A8C7A]">Predicción de peso (próximos 6 meses)</h3>
            <p className="text-sm text-[#6E7C72] mt-1">Basado en el modelo exponencial P(t) = P₀ · e^(kt)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E6E3DE]">
              <thead className="bg-[#FAF9F7]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Mes</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Fecha estimada</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Peso estimado</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E6E3DE]">
                {predictions.map((pred) => (
                  <tr key={pred.month} className="hover:bg-[#FAF9F7]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2C3E34]">Mes {pred.month}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6E7C72]">{formatDate(pred.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#2C3E34]">{formatWeight(pred.weight)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {pred.isIdeal ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-[#A8CF45]/20 text-[#2C3E34]">
                          Alcanza peso ideal
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-[#E6E3DE] text-[#6E7C72]">
                          En proceso
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historial de pesos */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
        <div className="bg-[#FAF9F7] px-6 py-4 border-b border-[#E6E3DE]">
          <h3 className="text-lg font-bold text-[#5A8C7A]">Historial de mediciones</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#E6E3DE]">
            <thead className="bg-[#FAF9F7]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Peso</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">% Grasa</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">% Músculo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6E7C72] uppercase tracking-wider">Cintura (cm)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E6E3DE]">
              {sortedWeightHistory.map((record, idx) => (
                <tr key={idx} className="hover:bg-[#FAF9F7]">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2C3E34]">{formatDate(record.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#2C3E34]">{formatWeight(record.weight)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6E7C72]">{record.bodyFat ? `${record.bodyFat}%` : '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6E7C72]">{record.muscle ? `${record.muscle}%` : '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6E7C72]">{record.waist ? `${record.waist} cm` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalles del modelo (colapsable) */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E6E3DE] overflow-hidden">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-6 py-4 flex justify-between items-center hover:bg-[#FAF9F7] transition-colors"
        >
          <span className="font-semibold text-[#5A8C7A]">Ver detalles del modelo matemático</span>
          <svg className={`w-5 h-5 text-[#6E7C72] transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showDetails && (
          <div className="px-6 py-4 border-t border-[#E6E3DE] bg-[#FAF9F7] space-y-3">
            <p className="text-sm text-[#2C3E34]">
              <strong>Modelo utilizado:</strong> Decremento exponencial P(t) = P₀ · e^(kt)
            </p>
            <p className="text-sm text-[#2C3E34]">
              <strong>Peso inicial (P₀):</strong> {formatWeight(initialWeight)}
            </p>
            <p className="text-sm text-[#2C3E34]">
              <strong>Peso actual:</strong> {formatWeight(currentWeight)}
            </p>
            <p className="text-sm text-[#2C3E34]">
              <strong>Constante de decremento (k):</strong> {k !== null ? k.toFixed(4) : 'No disponible'}
            </p>
            {k !== null && (
              <p className="text-sm text-[#2C3E34]">
                <strong>Ecuación del modelo:</strong> P(t) = {currentWeight.toFixed(1)} · e^({k.toFixed(4)} · t)
              </p>
            )}
            {patient.height && idealWeight && (
              <p className="text-sm text-[#2C3E34]">
                <strong>Cálculo del peso ideal:</strong> {idealWeight.toFixed(2)} kg = 22 × ({patient.height / 100})²
              </p>
            )}
            {monthsToIdeal && monthsToIdeal > 0 && (
              <p className="text-sm text-[#2C3E34]">
                <strong>Tiempo estimado:</strong> {monthsToIdeal} meses para alcanzar el peso ideal
              </p>
            )}
            <p className="text-sm text-[#6E7C72] italic mt-2">
              Este modelo asume que la pérdida de peso es proporcional al peso actual, lo que significa que al inicio la pérdida es más rápida y se desacelera con el tiempo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}