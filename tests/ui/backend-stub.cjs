const data = require('./data.cjs');
module.exports = async function mockAction(name, ...args) {
  window.__calls ||= [];
  window.__calls.push({ name, args });
  const d = data;
  const exact = {
    getCalendarSettings: d.settings, getExceptions: [],
    getPatients: { patients: [d.patient], total: 1 }, getPatientsStats: d.stats,
    getPatientById: d.patient, getPatientByUserId: d.patient,
    getAppointmentsByDateRange: [{appointment_date: new Date(d.dateString),total:3}],
    getPatientAppointmentsByDateRange: [d.appointment], getPatientUpcomingAppointments: [d.appointment],
    getTodayAppointments: [d.appointment], getAppointmentsByDay: [d.appointment],
    getWeeklyAppointmentsCount: 4, getPendingAppointmentsCount: 1,
    getAvailableSlots: ['09:00:00','10:00:00','11:00:00'],
    getAvailableSlotsForPatient: ['09:00:00','10:00:00','11:00:00'],
    getProductos: {productos:[d.product],total:1}, getCategoriasByProducto: [1],
    verificarNombreProducto: false, getGeneralRecommendations: [], getRecommendations: [],
    getPosts: [d.post], obtenerMetricasBaseDatos:d.metrics,
    getInitialEvaluationByPatientId:d.evaluation,getFollowUpEvaluationByAppointmentId:d.evaluation,
    getMenuTemplates:[], getActiveMealOptions:[],
    calculatePredictiveModel:{success:false,message:'Estado vacío de prueba sin datos suficientes'},
    getInitialEvaluation: d.evaluation, getFollowUpEvaluations: [d.evaluation],
    getActiveNutritionPlan: d.plan, getPatientInitialEvaluation: d.evaluation,
    getPatientFollowUpEvaluations: [d.evaluation], getPatientActiveNutritionPlan: d.plan,
    getAllMealOptions: [], getMealOptions: [], getPatientMedicalHistory: { patient:d.patient, initialEvaluation:d.evaluation, followUpEvaluations:[d.evaluation],nutritionPlan:d.plan },
  };
  if (name in exact) return exact[name];
  if (/^(create|update|save|delete|eliminar|cancel|mark|change|set)/i.test(name)) return { success:true, message:'Acción simulada', data:{} };
  return [];
};
