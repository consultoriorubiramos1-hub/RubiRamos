import React from 'react';
import { createRoot } from 'react-dom/client';
import { PDFDownloadLink } from '@react-pdf/renderer';
import AdminPDF from '../../src/components/medical-history/AdminMedicalHistoryPDF';
import PatientPDF from '../../src/components/patient-medical-history/MedicalHistoryPDF';
// The fixture deliberately supplies synthetic legacy records only.
import data from './data.cjs';

const props = { patient:data.patient, initialEvaluation:data.evaluation, followUpEvaluations:[data.evaluation], nutritionPlan:data.plan, generalRecommendations:[] };
createRoot(document.getElementById('root')!).render(<div>
  <PDFDownloadLink document={<AdminPDF {...props} />} fileName="browser-admin.pdf">Descargar administrador</PDFDownloadLink>
  <PDFDownloadLink document={<PatientPDF {...props} />} fileName="browser-patient.pdf">Descargar paciente</PDFDownloadLink>
</div>);
