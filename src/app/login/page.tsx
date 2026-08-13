import { Suspense } from 'react';
import Form from "@/components/login/form"; 
import { HelpCircle } from "lucide-react";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acceso al Consultorio',
  description: 'Sistema interno de gestión de pacientes y citas del Consultorio Nutricional.',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF9F7]">
      <div className="relative w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 p-6">
        {/* Sección informativa */}
        <div className="w-full lg:w-1/2 max-w-md space-y-6 text-center lg:text-left">
          <div>
            <h1 className="text-3xl font-bold text-[#6B8E7B]">Rubí Ramos</h1>
            <p className="text-sm text-[#6E7C72] mt-1">Consultorio Nutricional</p>
          </div>
          
          <h2 className="text-xl font-semibold text-[#2C3E34]">
            Sistema de gestión del consultorio
          </h2>
          
          <p className="text-[#6E7C72]">
            Plataforma interna para el control de pacientes, citas y expedientes clínicos. 
            El acceso está restringido únicamente al personal autorizado.
          </p>
          
          <div className="hidden lg:block pt-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-[#E6E3DE]">
              <h3 className="font-medium text-[#2C3E34] mb-3 flex items-center">
                <HelpCircle className="h-5 w-5 text-[#6B8E7B] mr-2" />
                ¿Necesitas ayuda?
              </h3>
              <p className="text-sm text-[#6E7C72]">
                Si tienes problemas para iniciar sesión o necesitas asistencia, 
                contacta al área administrativa del consultorio.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de inicio de sesión con Suspense */}
        <div className="w-full max-w-md flex items-center justify-center">
          <Suspense fallback={
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-[#E6E3DE]">
              <div className="flex justify-center">
                <svg className="animate-spin h-8 w-8 text-[#5A8C7A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="mt-4 text-[#6E7C72]">Cargando formulario...</p>
            </div>
          }>
            <Form />
          </Suspense>
        </div>
      </div>
    </main>
  );
}