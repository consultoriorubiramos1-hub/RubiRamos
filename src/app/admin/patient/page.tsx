import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authConfig } from '@/lib/auth.config';
import { getPatientByUserId, getUpcomingAppointments, getAppointmentHistory, getPatientStats, getPatientPosts } from '@/lib/patient-dashboard-actions';
import PatientDashboardClient from '@/components/patient/PatientDashboardClient';

export const dynamic = 'force-dynamic';

export default async function PatientDashboardPage() {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    redirect('/login');
  }
  
  const userId = parseInt(session.user.id);
  const patient = await getPatientByUserId(userId);
  
  if (!patient) {
    redirect('/login?error=not_found');
  }
  
  const [upcomingAppointments, appointmentHistory, stats, posts] = await Promise.all([
    getUpcomingAppointments(patient.id, 5),
    getAppointmentHistory(patient.id, 10),
    getPatientStats(patient.id),
    getPatientPosts()
  ]);
  
  return (
    <PatientDashboardClient 
      patient={patient}
      upcomingAppointments={upcomingAppointments}
      appointmentHistory={appointmentHistory}
      stats={stats}
      posts={posts}
    />
  );
}