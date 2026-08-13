'use client';

import { useState } from 'react';
import { FaUser, FaPhone, FaEnvelope, FaWeight, FaRulerVertical, FaCalendar, FaNotesMedical, FaFileMedical, FaStar } from 'react-icons/fa';
/*import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Historial Médico',
};*/

// Datos de ejemplo del paciente
const patientData = {
  id: 1,
  name: 'María González',
  email: 'maria.gonzalez@email.com',
  phone: '+52 55 1234 5678',
  age: 34,
  gender: 'Femenino',
  weight: '68 kg',
  height: '165 cm',
  bloodType: 'O+',
  allergies: 'Ninguna conocida',
  lastAppointment: '2024-12-10',
  nextAppointment: '2024-12-20',
  status: 'Activo',
  initialDate: '2024-01-15'
};

// Historial de citas médicas
const medicalHistory = [
  {
    id: 1,
    date: '2024-12-10',
    type: 'Seguimiento mensual',
    weight: '68 kg',
    height: '165 cm',
    bloodPressure: '120/80 mmHg',
    notes: 'Paciente muestra excelente progreso en pérdida de peso. Ha perdido 2 kg desde la última visita. Se ajustó plan nutricional para incluir más proteínas. Se recomienda continuar con ejercicio cardiovascular 4 veces por semana.',
    recommendations: ['Aumentar ingesta de proteínas a 1.8g/kg', 'Continuar registro de alimentos', 'Próximo control en 3 semanas'],
    nutritionist: 'Dra. Rubi Ramos'
  },
  {
    id: 2,
    date: '2024-11-15',
    type: 'Control de progreso',
    weight: '70 kg',
    height: '165 cm',
    bloodPressure: '118/78 mmHg',
    notes: 'Paciente se adapta bien al plan nutricional. Reporta mejor energía durante el día. Se mantiene peso estable. Buen cumplimiento de las recomendaciones dietéticas.',
    recommendations: ['Mantener hidratación de 2L diarios', 'Incluir snacks saludables entre comidas', 'Monitorizar niveles de energía'],
    nutritionist: 'Dra. Rubi Ramos'
  },
  {
    id: 3,
    date: '2024-10-20',
    type: 'Evaluación inicial',
    weight: '72 kg',
    height: '165 cm',
    bloodPressure: '125/82 mmHg',
    notes: 'Primera consulta. Paciente busca pérdida de peso y mejora de hábitos alimenticios. Se estableció plan nutricional personalizado con déficit calórico controlado. Objetivo: pérdida de 0.5-1 kg por semana.',
    recommendations: ['Iniciar registro diario de alimentos', 'Comenzar rutina de ejercicio 3 veces/semana', 'Controlar porciones en comidas principales'],
    nutritionist: 'Dra. Rubi Ramos'
  },
  {
    id: 4,
    date: '2024-09-25',
    type: 'Consulta general',
    weight: '74 kg',
    height: '165 cm',
    bloodPressure: '130/85 mmHg',
    notes: 'Evaluación inicial de hábitos. Paciente reporta alimentación alta en carbohidratos procesados. Se discutieron objetivos realistas y se programó evaluación completa para siguiente cita.',
    recommendations: ['Reducir consumo de azúcares refinados', 'Aumentar ingesta de vegetales', 'Programar análisis de sangre'],
    nutritionist: 'Dra. Rubi Ramos'
  }
];

// Métricas de progreso
const progressMetrics = {
  initialWeight: 74,
  currentWeight: 68,
  goalWeight: 62,
  bmi: {
    initial: 27.2,
    current: 25.0,
    goal: 22.8
  },
  progress: [
    { month: 'Sep', weight: 74 },
    { month: 'Oct', weight: 72 },
    { month: 'Nov', weight: 70 },
    { month: 'Dic', weight: 68 }
  ]
};

export default function PatientMedicalHistory() {
  const [selectedAppointment, setSelectedAppointment] = useState(medicalHistory[0]);

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-green-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Mi Historial Médico
          </h1>
          <p className="text-xl text-gray-600">
            Bienvenida de vuelta, {patientData.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Información del paciente */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tarjeta de información personal */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUser className="text-blue-600 text-2xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">{patientData.name}</h2>
                <p className="text-gray-600">Paciente desde {new Date(patientData.initialDate).getFullYear()}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FaPhone className="text-gray-400" />
                  <span className="text-gray-700">{patientData.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-gray-400" />
                  <span className="text-gray-700">{patientData.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaUser className="text-gray-400" />
                  <span className="text-gray-700">{patientData.age} años • {patientData.gender}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaWeight className="text-gray-400" />
                  <span className="text-gray-700">{patientData.weight}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaRulerVertical className="text-gray-400" />
                  <span className="text-gray-700">{patientData.height}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <div className="text-sm text-blue-800">
                  <strong>Tipo de sangre:</strong> {patientData.bloodType}
                </div>
                <div className="text-sm text-blue-800 mt-1">
                  <strong>Alergias:</strong> {patientData.allergies}
                </div>
              </div>
            </div>

            {/* Próxima cita */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaCalendar className="text-green-500" />
                Próxima Cita
              </h3>
              {patientData.nextAppointment ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {new Date(patientData.nextAppointment).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </div>
                    <div className="text-green-700 font-medium">10:30 AM</div>
                    <div className="text-sm text-green-600 mt-2">Consulta de seguimiento</div>
                  </div>
                  <button className="w-full mt-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium">
                    Confirmar Asistencia
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No hay citas programadas</p>
                  <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                    Agendar Cita
                  </button>
                </div>
              )}
            </div>

            {/* Progreso de peso */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Mi Progreso</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Peso inicial</span>
                  <span className="font-bold text-gray-800">{progressMetrics.initialWeight} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Peso actual</span>
                  <span className="font-bold text-green-600">{progressMetrics.currentWeight} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Peso objetivo</span>
                  <span className="font-bold text-blue-600">{progressMetrics.goalWeight} kg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${((progressMetrics.initialWeight - progressMetrics.currentWeight) / (progressMetrics.initialWeight - progressMetrics.goalWeight)) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="text-center text-sm text-gray-600">
                  {progressMetrics.initialWeight - progressMetrics.currentWeight} kg perdidos • 
                  {progressMetrics.initialWeight - progressMetrics.goalWeight - (progressMetrics.initialWeight - progressMetrics.currentWeight)} kg por lograr
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Historial médico */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FaFileMedical className="text-blue-500" />
                  Historial de Consultas
                </h2>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                  Descargar Historial
                </button>
              </div>

              {/* Lista de consultas */}
              <div className="space-y-6">
                {medicalHistory.map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md ${
                      selectedAppointment.id === appointment.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {appointment.type}
                        </h3>
                        <p className="text-gray-600">
                          {new Date(appointment.date).toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Peso: {appointment.weight}</div>
                        <div className="text-sm text-gray-500">Altura: {appointment.height}</div>
                      </div>
                    </div>

                    {/* Notas resumidas */}
                    <p className="text-gray-700 line-clamp-2">
                      {appointment.notes}
                    </p>

                    {selectedAppointment.id === appointment.id && (
                      <div className="mt-4 space-y-4 animate-fadeIn">
                        {/* Notas completas */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <FaNotesMedical className="text-blue-500" />
                            Notas de la Consulta
                          </h4>
                          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                            {appointment.notes}
                          </p>
                        </div>

                        {/* Recomendaciones */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Recomendaciones</h4>
                          <ul className="space-y-2">
                            {appointment.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2 text-gray-700">
                                <FaStar className="text-yellow-500 mt-1 flex-shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mensaje si no hay historial */}
              {medicalHistory.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FaFileMedical className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p>No hay consultas registradas en tu historial</p>
                  <button className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                    Agendar Primera Cita
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}