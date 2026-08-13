'use client';

import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Registrar fuentes
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxP.ttf' },
    { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmWUlfBBc9.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Roboto'
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#BD7D4A',
    paddingBottom: 10
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#BD7D4A',
    textAlign: 'center'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6E7C72',
    textAlign: 'center',
    marginTop: 5
  },
  section: {
    marginBottom: 15,
    breakInside: 'avoid'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5A8C7A',
    marginBottom: 8,
    backgroundColor: '#FAF9F7',
    padding: 5,
    borderRadius: 4
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2C3E34',
    marginTop: 8,
    marginBottom: 4
  },
  text: {
    fontSize: 10,
    color: '#2C3E34',
    lineHeight: 1.5,
    marginBottom: 2
  },
  label: {
    fontWeight: 'bold',
    fontSize: 10,
    color: '#2C3E34'
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4
  },
  col: {
    flex: 1,
    flexDirection: 'column'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  gridItem: {
    width: '33%',
    marginBottom: 4
  },
  table: {
    marginTop: 8,
    marginBottom: 8
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FAF9F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E3DE',
    paddingVertical: 4
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E3DE',
    paddingVertical: 4
  },
  tableCell: {
    fontSize: 8,
    paddingHorizontal: 4,
    flex: 1
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    flex: 1
  },
  image: {
    marginVertical: 10,
    maxWidth: '100%',
    maxHeight: 300,
    objectFit: 'contain'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#6E7C72',
    borderTopWidth: 1,
    borderTopColor: '#E6E3DE',
    paddingTop: 10
  },
  recommendationBox: {
    backgroundColor: '#FAF9F7',
    padding: 8,
    marginBottom: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#BD7D4A'
  },
  recommendationTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#BD7D4A',
    marginBottom: 4
  },
  recommendationText: {
    fontSize: 9,
    color: '#2C3E34',
    lineHeight: 1.4
  },
  pageBreak: {
    pageBreakBefore: 'always'
  },
  mealTimeText: {
    fontSize: 10,
    color: '#2C3E34',
    marginBottom: 2
  }
});

interface MedicalHistoryPDFProps {
  patient: any;
  initialEvaluation: any;
  followUpEvaluations: any[];
  nutritionPlan: any;
  generalRecommendations: any[];
}

export default function MedicalHistoryPDF({
  patient,
  initialEvaluation,
  followUpEvaluations,
  nutritionPlan,
  generalRecommendations
}: MedicalHistoryPDFProps) {
  
  const formatDate = (date: string | Date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES');
  };

  const formatNumber = (value: number | string | null | undefined, decimals: number = 1) => {
    if (value === null || value === undefined) return '—';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '—';
    return numValue.toFixed(decimals);
  };

  const getGenderText = (gender: string) => {
    if (gender === 'M') return 'Masculino';
    if (gender === 'F') return 'Femenino';
    return 'No especificado';
  };

  const getMealContent = (menuId: string, meal: string) => {
    return nutritionPlan?.menus?.[menuId]?.meals?.[meal]?.description || '';
  };

  const MEAL_TYPES = ['DESAYUNO', 'ALMUERZO', 'COLACION', 'COMIDA', 'CENA'];
  const MENUS = [
    { id: 'MENU_1', name: 'Menú 1', days: 'Lunes, Miércoles' },
    { id: 'MENU_2', name: 'Menú 2', days: 'Martes, Viernes' },
    { id: 'MENU_3', name: 'Menú 3', days: 'Jueves' },
    { id: 'MENU_4', name: 'Menú 4', days: 'Sábado, Domingo' }
  ];

  return (
    <Document>
      {/* Página 1 - Información del paciente y evaluación inicial */}
      <Page size="A4" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Consultorio Rubí Ramos</Text>
          <Text style={styles.headerSubtitle}>Historial Médico del Paciente</Text>
        </View>

        {/* Información del paciente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Paciente</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.text}><Text style={styles.label}>Nombre completo:</Text> {patient.nombre_completo}</Text>
              <Text style={styles.text}><Text style={styles.label}>Email:</Text> {patient.email}</Text>
              <Text style={styles.text}><Text style={styles.label}>Teléfono:</Text> {patient.phone || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.text}><Text style={styles.label}>Edad:</Text> {patient.age} años</Text>
              <Text style={styles.text}><Text style={styles.label}>Género:</Text> {getGenderText(patient.gender)}</Text>
              <Text style={styles.text}><Text style={styles.label}>Estatura:</Text> {patient.height ? `${patient.height} cm` : '—'}</Text>
            </View>
          </View>
        </View>

        {/* Evaluación Inicial */}
        {initialEvaluation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evaluación Inicial</Text>
            
            <Text style={styles.subsectionTitle}>Motivo de Consulta</Text>
            <Text style={styles.text}>Objetivo principal: {initialEvaluation.consultation_reason?.main_goal || '—'}</Text>
            <Text style={styles.text}>Desde cuándo: {initialEvaluation.consultation_reason?.onset_date ? formatDate(initialEvaluation.consultation_reason.onset_date) : '—'}</Text>
            <Text style={styles.text}>Expectativas: {initialEvaluation.consultation_reason?.treatment_expectations || '—'}</Text>

            <Text style={styles.subsectionTitle}>Antecedentes Heredofamiliares</Text>
            <View style={styles.grid}>
              <View style={styles.gridItem}><Text style={styles.text}>• Diabetes: {initialEvaluation.family_history?.diabetes ? 'Sí' : 'No'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.text}>• Hipertensión: {initialEvaluation.family_history?.hypertension ? 'Sí' : 'No'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.text}>• Obesidad: {initialEvaluation.family_history?.obesity ? 'Sí' : 'No'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.text}>• Dislipidemia: {initialEvaluation.family_history?.dyslipidemia ? 'Sí' : 'No'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.text}>• Enf. Cardiovascular: {initialEvaluation.family_history?.cardiovascular_disease ? 'Sí' : 'No'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.text}>• Cáncer: {initialEvaluation.family_history?.cancer ? 'Sí' : 'No'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.text}>• SOP: {initialEvaluation.family_history?.pcos ? 'Sí' : 'No'}</Text></View>
            </View>
            {initialEvaluation.family_history?.other_conditions && (
              <Text style={styles.text}>Otros: {initialEvaluation.family_history.other_conditions}</Text>
            )}

            <Text style={styles.subsectionTitle}>Antecedentes Personales Patológicos</Text>
            <Text style={styles.text}>Enfermedades actuales: {initialEvaluation.personal_history?.current_diseases || '—'}</Text>
            <Text style={styles.text}>Enfermedades previas: {initialEvaluation.personal_history?.past_diseases || '—'}</Text>
            <Text style={styles.text}>Cirugías: {initialEvaluation.personal_history?.surgeries || '—'}</Text>
            <Text style={styles.text}>Medicamentos actuales: {initialEvaluation.personal_history?.current_medications || '—'}</Text>
            <Text style={styles.text}>Suplementos: {initialEvaluation.personal_history?.supplements || '—'}</Text>
            <Text style={styles.text}>Alergias/intolerancias: {initialEvaluation.personal_history?.allergies_intolerances || '—'}</Text>

            <Text style={styles.subsectionTitle}>Antecedentes No Patológicos</Text>
            <Text style={styles.text}>Actividad física: {initialEvaluation.non_pathological_history?.physical_activity_type || '—'} ({initialEvaluation.non_pathological_history?.physical_activity_frequency || '—'})</Text>
            <Text style={styles.text}>Duración: {initialEvaluation.non_pathological_history?.physical_activity_duration || '—'}</Text>
            <Text style={styles.text}>Alcohol: {initialEvaluation.non_pathological_history?.alcohol_consumption || '—'}</Text>
            <Text style={styles.text}>Tabaquismo: {initialEvaluation.non_pathological_history?.smoking || '—'}</Text>
            <Text style={styles.text}>Calidad de sueño: {initialEvaluation.non_pathological_history?.sleep_quality || '—'}</Text>
            <Text style={styles.text}>Estrés: {initialEvaluation.non_pathological_history?.stress_level || '—'}</Text>
            <Text style={styles.text}>Hidratación: {initialEvaluation.non_pathological_history?.daily_hydration || '—'}</Text>

            {initialEvaluation.gynecological_history && (
              <>
                <Text style={styles.subsectionTitle}>Historia Ginecológica</Text>
                <Text style={styles.text}>Edad de menarca: {initialEvaluation.gynecological_history.menarche_age || '—'}</Text>
                <Text style={styles.text}>Ciclo menstrual: {initialEvaluation.gynecological_history.menstrual_cycle || '—'}</Text>
                <Text style={styles.text}>Duración del ciclo: {initialEvaluation.gynecological_history.cycle_duration || '—'}</Text>
                <Text style={styles.text}>Síntomas: {initialEvaluation.gynecological_history.symptoms || '—'}</Text>
                <Text style={styles.text}>Embarazos: {initialEvaluation.gynecological_history.pregnancies || '—'}</Text>
                <Text style={styles.text}>Anticonceptivos: {initialEvaluation.gynecological_history.contraceptives_use ? `Sí - ${initialEvaluation.gynecological_history.contraceptives_type || ''}` : 'No'}</Text>
              </>
            )}

            <Text style={styles.subsectionTitle}>Evaluación Dietética</Text>
            <Text style={[styles.subsectionTitle, { fontSize: 10 }]}>Recordatorio 24 horas</Text>
            <Text style={styles.text}>Desayuno: {initialEvaluation.dietary_recall?.breakfast || '—'}</Text>
            <Text style={styles.text}>Colación AM: {initialEvaluation.dietary_recall?.morning_snack || '—'}</Text>
            <Text style={styles.text}>Comida: {initialEvaluation.dietary_recall?.lunch || '—'}</Text>
            <Text style={styles.text}>Colación PM: {initialEvaluation.dietary_recall?.afternoon_snack || '—'}</Text>
            <Text style={styles.text}>Cena: {initialEvaluation.dietary_recall?.dinner || '—'}</Text>
            <Text style={styles.text}>Snacks/bebidas: {initialEvaluation.dietary_recall?.snacks_beverages || '—'}</Text>

            <Text style={[styles.subsectionTitle, { fontSize: 10, marginTop: 8 }]}>Frecuencia de consumo</Text>
            <View style={styles.grid}>
              <View style={styles.gridItem}><Text style={styles.text}>Frutas: {initialEvaluation.food_frequency?.fruits || '—'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.text}>Verduras: {initialEvaluation.food_frequency?.vegetables || '—'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.text}>Proteínas: {initialEvaluation.food_frequency?.proteins || '—'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.text}>Lácteos: {initialEvaluation.food_frequency?.dairy || '—'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.text}>Cereales: {initialEvaluation.food_frequency?.cereals || '—'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.text}>Ultraprocesados: {initialEvaluation.food_frequency?.ultraprocessed || '—'}</Text></View>
              <View style={styles.gridItem}><Text style={styles.text}>Azúcares: {initialEvaluation.food_frequency?.sugars || '—'}</Text></View>
            </View>

            <Text style={[styles.subsectionTitle, { fontSize: 10 }]}>Hábitos alimentarios</Text>
            <Text style={styles.text}>Horarios de comida: {initialEvaluation.feeding_habits?.meal_schedules || '—'}</Text>
            <Text style={styles.text}>Ansiedad por comer: {initialEvaluation.feeding_habits?.eating_anxiety || '—'}</Text>
            <Text style={styles.text}>Atracones: {initialEvaluation.feeding_habits?.binges || '—'}</Text>
            <Text style={styles.text}>Comer emocional: {initialEvaluation.feeding_habits?.emotional_eating || '—'}</Text>
            <Text style={styles.text}>Comer fuera de casa: {initialEvaluation.feeding_habits?.eating_out || '—'}</Text>
          </View>
        )}

        <View style={styles.pageBreak} />
      </Page>

      {/* Página 2 - Progreso */}
      {followUpEvaluations.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Consultorio Rubí Ramos</Text>
            <Text style={styles.headerSubtitle}>Historial de Progreso - {patient.nombre_completo}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resultados de Seguimiento</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, { width: '12%' }]}>FECHA</Text>
                <Text style={[styles.tableCellHeader, { width: '8%' }]}>PESO</Text>
                <Text style={[styles.tableCellHeader, { width: '8%' }]}>%GRASA</Text>
                <Text style={[styles.tableCellHeader, { width: '8%' }]}>%MÚSCULO</Text>
                <Text style={[styles.tableCellHeader, { width: '8%' }]}>CINTURA</Text>
                <Text style={[styles.tableCellHeader, { width: '8%' }]}>CADERA</Text>
                <Text style={[styles.tableCellHeader, { width: '8%' }]}>BRAZO</Text>
                <Text style={[styles.tableCellHeader, { width: '8%' }]}>CUELLO</Text>
                <Text style={[styles.tableCellHeader, { width: '8%' }]}>T/A</Text>
              </View>
              {followUpEvaluations.map((evaluation, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '12%' }]}>{formatDate(evaluation.evaluation_date)}</Text>
                  <Text style={[styles.tableCell, { width: '8%' }]}>{formatNumber(evaluation.anthropometric?.weight)}</Text>
                  <Text style={[styles.tableCell, { width: '8%' }]}>{formatNumber(evaluation.anthropometric?.body_fat_percentage)}</Text>
                  <Text style={[styles.tableCell, { width: '8%' }]}>{formatNumber(evaluation.anthropometric?.muscle_percentage)}</Text>
                  <Text style={[styles.tableCell, { width: '8%' }]}>{formatNumber(evaluation.anthropometric?.waist_circumference)}</Text>
                  <Text style={[styles.tableCell, { width: '8%' }]}>{formatNumber(evaluation.anthropometric?.hip_circumference)}</Text>
                  <Text style={[styles.tableCell, { width: '8%' }]}>{formatNumber(evaluation.anthropometric?.arm_circumference)}</Text>
                  <Text style={[styles.tableCell, { width: '8%' }]}>{formatNumber(evaluation.anthropometric?.neck_circumference)}</Text>
                  <Text style={[styles.tableCell, { width: '8%' }]}>
                    {evaluation.anthropometric?.blood_pressure_systolic ? 
                      `${evaluation.anthropometric.blood_pressure_systolic}/${evaluation.anthropometric.blood_pressure_diastolic || '—'}` : '—'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {followUpEvaluations.map((evaluation, idx) => (
            <View key={idx} style={styles.section}>
              <Text style={styles.sectionTitle}>Evaluación del {formatDate(evaluation.evaluation_date)}</Text>
              
              {evaluation.nutritional_diagnosis?.diagnosis && (
                <>
                  <Text style={styles.subsectionTitle}>Diagnóstico Nutricional</Text>
                  <Text style={styles.text}>{evaluation.nutritional_diagnosis.diagnosis}</Text>
                </>
              )}

              {evaluation.intervention_plan && (evaluation.intervention_plan.nutritional_goals || evaluation.intervention_plan.dietary_strategy) && (
                <>
                  <Text style={styles.subsectionTitle}>Plan de Intervención</Text>
                  {evaluation.intervention_plan.nutritional_goals && (
                    <Text style={styles.text}>Objetivos: {evaluation.intervention_plan.nutritional_goals}</Text>
                  )}
                  {evaluation.intervention_plan.dietary_strategy && (
                    <Text style={styles.text}>Estrategia: {evaluation.intervention_plan.dietary_strategy}</Text>
                  )}
                  {evaluation.intervention_plan.specific_recommendations && (
                    <Text style={styles.text}>Recomendaciones: {evaluation.intervention_plan.specific_recommendations}</Text>
                  )}
                  {evaluation.intervention_plan.supplementation && (
                    <Text style={styles.text}>Suplementación: {evaluation.intervention_plan.supplementation}</Text>
                  )}
                </>
              )}

              {evaluation.follow_up && (evaluation.follow_up.next_appointment_date || evaluation.follow_up.observations) && (
                <>
                  <Text style={styles.subsectionTitle}>Seguimiento</Text>
                  {evaluation.follow_up.next_appointment_date && (
                    <Text style={styles.text}>Próxima cita: {formatDate(evaluation.follow_up.next_appointment_date)}</Text>
                  )}
                  {evaluation.follow_up.observations && (
                    <Text style={styles.text}>Observaciones: {evaluation.follow_up.observations}</Text>
                  )}
                </>
              )}
            </View>
          ))}

          <View style={styles.pageBreak} />
        </Page>
      )}

      {/* Página 3 - Plan Alimenticio */}
      {nutritionPlan && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Consultorio Rubí Ramos</Text>
            <Text style={styles.headerSubtitle}>Plan Alimenticio - {patient.nombre_completo}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horarios de Comidas</Text>
            {MEAL_TYPES.map(meal => {
              const mealTime = nutritionPlan.meal_times?.[meal];
              if (!mealTime?.start && meal !== 'COLACION') return null;
              return (
                <Text key={meal} style={styles.mealTimeText}>
                  {meal}: {meal === 'COLACION' ? 'A elección' : `${mealTime?.start} - ${mealTime?.end}`}
                </Text>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plan de Comidas Semanal</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCellHeader, { width: '20%' }]}>Comida</Text>
                {MENUS.map(menu => (
                  <View key={menu.id} style={{ width: '20%', flexDirection: 'column' }}>
                    <Text style={[styles.tableCellHeader, { textAlign: 'center' }]}>{menu.name}</Text>
                    <Text style={[styles.tableCellHeader, { textAlign: 'center', fontSize: 7 }]}>{menu.days}</Text>
                  </View>
                ))}
              </View>
              {MEAL_TYPES.map(meal => (
                <View key={meal} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>{meal}</Text>
                  {MENUS.map(menu => {
                    const content = getMealContent(menu.id, meal);
                    return (
                      <Text key={menu.id} style={[styles.tableCell, { width: '20%', fontSize: 8 }]}>
                        {content || '—'}
                      </Text>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.pageBreak} />
        </Page>
      )}

      {/* Página 4 - Recomendaciones Generales */}
      {generalRecommendations.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Consultorio Rubí Ramos</Text>
            <Text style={styles.headerSubtitle}>Recomendaciones Generales</Text>
          </View>

            <View style={styles.section}>
            {generalRecommendations
                .filter(rec => rec.is_active)
                .sort((a, b) => a.display_order - b.display_order)
                .map((recommendation) => (
                <View key={recommendation.id} style={styles.recommendationBox}>
                    <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
                    {recommendation.type === 'image' && recommendation.image_url ? (
                    <Image src={recommendation.image_url} style={styles.image} />
                    ) : (
                    <Text style={styles.recommendationText}>
                        {recommendation.content?.split('\n').map((line: string, i: number) => {
                        // Reemplazar caracteres HTML escapados
                        let cleanLine = line
                            .replace(/&bull;/g, '•')
                            .replace(/&nbsp;/g, ' ')
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'")
                            .replace(/&ldquo;/g, '"')
                            .replace(/&rdquo;/g, '"')
                            .replace(/&lsquo;/g, "'")
                            .replace(/&rsquo;/g, "'");
                        
                        // También reemplazar viñetas en formato texto como "•"
                        if (cleanLine.trim().startsWith('•') || cleanLine.trim().startsWith('-')) {
                            // Ya tiene viñeta, mantener
                        } else if (cleanLine.trim().startsWith('EVITAR') || 
                                    cleanLine.trim().startsWith('CONSUME') || 
                                    cleanLine.trim().startsWith('REALIZA') || 
                                    cleanLine.trim().startsWith('RESPETA') ||
                                    cleanLine.trim().startsWith('PUEDES') ||
                                    cleanLine.trim().startsWith('UN DIA') ||
                                    cleanLine.trim().startsWith('EVITA')) {
                            // Agregar viñeta si no tiene
                            cleanLine = `• ${cleanLine}`;
                        }
                        
                        return (
                            <Text key={i}>
                            {cleanLine}
                            {i < recommendation.content.split('\n').length - 1 ? '\n' : ''}
                            </Text>
                        );
                        })}
                    </Text>
                    )}
                </View>
                ))}
            </View>

          <View style={styles.footer}>
            <Text>Documento generado el {new Date().toLocaleDateString('es-ES')}</Text>
            <Text>Consultorio Rubí Ramos - Todos los derechos reservados</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}