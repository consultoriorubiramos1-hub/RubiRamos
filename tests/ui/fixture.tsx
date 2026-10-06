// @ts-nocheck -- Synthetic fixture contracts intentionally cover legacy UI shapes.
import React from 'react';
import { createRoot } from 'react-dom/client';
import data from './data.cjs';
import AdminLayout from '../../src/components/dashboard/AdminLayoutClient';
import PatientLayout from '../../src/components/patient/PatientLayoutClient';
import AdminCalendar from '../../src/app/admin/calendar/page';
import PatientCalendar from '../../src/app/admin/patient/calendar/page';
import Patients from '../../src/components/patients/PatientList';
import Products from '../../src/components/productos/products';
import Catalog from '../../src/components/catalog/CatalogClient';
import PatientModal from '../../src/components/patients/PatientModal';
import ProductModal from '../../src/components/productos/modalProducto';
import ClinicalModal from '../../src/components/citas/ClinicalEvaluationModal';
import SettingsModal from '../../src/components/calendar/SettingsModal';
import AppointmentModal from '../../src/components/calendar/AppointmentModal';
import PatientAppointmentModal from '../../src/components/patient/PatientAppointmentModal';
import Profile from '../../src/components/patient-profile/PatientProfileForm';
import PatientDashboard from '../../src/components/patient/PatientDashboardClient';
import AdminDashboard from '../../src/components/dashboard/DashboardClient';
import PatientProgress from '../../src/components/patient-medical-history/PatientProgressView';
import PatientPlan from '../../src/components/patient-medical-history/PatientNutritionPlanViewer';
import PatientPredictive from '../../src/components/patient-medical-history/PatientPredictiveModule';
import PatientHistory from '../../src/components/patient-medical-history/PatientMedicalHistoryClient';
import AdminHistory from '../../src/components/medical-history/MedicalHistoryClient';
import NutritionPlan from '../../src/components/medical-history/NutritionPlan';
import Menus from '../../src/components/menus/MealOptionsManager';
import Appointments from '../../src/components/citas/CitasClient';
import Cart from '../../src/components/car_shop/ShoppingCart';
import Recommendations from '../../src/components/recommendations/RecommendationsModal';
import Posts from '../../src/components/muro/PostsList';
import PatientPosts from '../../src/components/patient-muro/PatientPostsList';
import CreatePost from '../../src/components/muro/CreatePostModal';
import Metrics from '../../src/components/monitoreo/metricasCards';
import Audit from '../../src/components/monitoreo/auditoria';
import Db from '../../src/app/admin/db/page';
import Alexa from '../../src/app/admin/alexa/page';
import Payments from '../../src/components/citas/PendingPaymentsReview';
import Predictive from '../../src/components/medical-history/PredictiveModule';
import ConnectionStatus from '../../src/components/pwa/ConnectionStatus';

const close = () => { window.__closed = true; };
const d = data;
const common = { isOpen:true, onClose:close, onSuccess:close };
const screens: Record<string, React.ReactNode> = {
  'admin-calendar': <AdminCalendar />,
  'patient-calendar': <PatientCalendar />,
  patients: <Patients initialPatients={[d.patient]} initialTotal={1} initialStats={d.stats} />,
  products: <Products productosIniciales={[d.product]} totalInicial={1} categorias={d.categories} />,
  catalog: <Catalog productosIniciales={[d.product]} categorias={d.categories} queryInicial="" categoriaSeleccionadaInicial="todos" />,
  'patient-edit': <PatientModal {...common} patient={d.patient} mode="edit" />,
  'product-edit': <ProductModal {...common} producto={d.product} categorias={d.categories} />,
  'clinical-initial': <ClinicalModal {...common} appointment={d.appointment} evaluationType="initial" />,
  'clinical-followup': <ClinicalModal {...common} appointment={d.appointment} evaluationType="followup" />,
  settings: <SettingsModal {...common} onSave={close} type="general" initialSettings={d.settings} />,
  'appointment-admin': <AppointmentModal {...common} selectedDate={new Date(d.dateString)} />,
  'patient-appointment': <PatientAppointmentModal {...common} selectedDate={new Date(d.dateString)} patientId={d.patient.id} depositAmount={100} />,
  'patient-profile': <Profile initialProfile={d.patient} userId={d.patient.id} />,
  'patient-dashboard': <PatientDashboard patient={d.patient} upcomingAppointments={[d.appointment]} appointmentHistory={[d.appointment]} stats={d.stats} posts={[{...d.post,images:d.post.images.map(image=>image.url)}]} />,
  'patient-dashboard-empty': <PatientDashboard patient={d.patient} upcomingAppointments={[]} appointmentHistory={[]} stats={{...d.stats,pesoInicial:null,pesoActual:null,proximaCita:null}} posts={[]} />,
  'admin-dashboard': <AdminDashboard stats={d.stats} userName="Rubí de prueba" />,
  'patient-progress': <PatientProgress followUpEvaluations={[d.evaluation]} />,
  'patient-plan': <PatientPlan nutritionPlan={d.plan} />,
  'patient-predictive': <PatientPredictive patient={d.patient} weightHistory={[{evaluation_date:d.dateString,weight:75,height:165,anthropometric:d.evaluation.anthropometric}]} />,
  'patient-history': <PatientHistory patient={d.patient} initialEvaluation={d.evaluation} followUpEvaluations={[d.evaluation]} nutritionPlan={d.plan} predictiveData={[]} />,
  'admin-history': <AdminHistory initialPatients={[d.patient]} preselectedPatient={d.patient} />,
  'nutrition-plan': <NutritionPlan patientId={d.patient.id} />,
  menus: <Menus initialOptions={[]} />,
  appointments: <Appointments initialAppointments={[d.appointment]} />,
  cart: <Cart />,
  recommendations: <Recommendations {...common} onSave={close} />,
  'admin-posts':<Posts initialPosts={[d.post]} userId={999999} />,
  'patient-posts':<PatientPosts initialPosts={[d.post]} userId={999999} />,
  'post-edit':<CreatePost {...common} post={d.post} userId={999999} />,
  metrics:<Metrics />,
  audit:<Audit auditoriaInicial={[{id:1,usuario:'pruebas',accion:'UPDATE',tabla_afectada:'tabla_ficticia',created_at:d.dateString,datos_nuevos:{dato:'ficticio'}}]} total={1} />,
  db:<Db />,
  alexa:<Alexa />,
  payments:<Payments initialAppointments={[{id:999999,patientId:999999,patientName:d.patient.nombre_completo,phone:d.patient.phone,email:d.patient.email,appointmentDate:d.dateString,startTime:'09:00',endTime:'10:00',depositAmount:100,paymentStatus:'pending_review',paymentReference:'referencia_ficticia',paymentReceiptUrl:'/colageno.png',paymentSubmittedAt:d.dateString,notes:'Notas ficticias'}]} />,
  'admin-predictive':<Predictive patientId={999999} />,
};
const screen = new URLSearchParams(location.search).get('screen') || 'patients';
const Layout = screen.startsWith('patient-') && screen !== 'patient-edit' ? PatientLayout : AdminLayout;
createRoot(document.getElementById('root')!).render(<><ConnectionStatus /><Layout>{screens[screen] || 'Pantalla desconocida'}</Layout></>);
