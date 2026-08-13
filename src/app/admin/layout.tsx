import type { Metadata } from "next";
import AdminLayoutClient from "@/components/dashboard/AdminLayoutClient";
import ProtectedRoute from "@/components/auth/protected_route";
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    template: "%s | Panel de Control",
    default: "Panel de Control",
  },
  description: "Panel de control - Consultorio Nutricional Rubí Ramos",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={[1, 2]}>
      <AdminLayoutClient>{children}</AdminLayoutClient>
      <Toaster position="top-right"/>
    </ProtectedRoute>
  );
}