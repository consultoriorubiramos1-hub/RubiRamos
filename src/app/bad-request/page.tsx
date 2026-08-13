"use client";

import Link from "next/link";

export default function BadRequestPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF9F7] p-6">
      <div className="max-w-4xl w-full">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#6B8E7B]/10 to-[#A8CF45]/5 mb-8 border-2 border-[#6B8E7B]/20">
            <div className="text-4xl">📋</div>
          </div>
          <h1 className="text-7xl md:text-8xl font-bold font-serif text-[#6B8E7B]">
            400
          </h1>
          <p className="text-lg text-[#6E7C72] mt-4 max-w-md mx-auto">
            Solicitud nutricional incorrecta
          </p>
        </div>

        {/* Contenido principal */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Visualización del problema */}
          <div className="relative">
            {/* Formulario "dañado" */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#E6E3DE] relative overflow-hidden">
              {/* Título del formulario */}
              <h3 className="text-lg font-semibold mb-6 font-serif text-[#2C3E34]">
                Análisis de la solicitud
              </h3>

              {/* Campos con errores */}
              <div className="space-y-6">
                {[
                  { label: 'Nombre completo', error: true },
                  { label: 'Correo electrónico', error: false },
                  { label: 'Teléfono', error: true },
                  { label: 'Mensaje', error: true },
                ].map((field, index) => (
                  <div key={index} className="relative">
                    <div className={`text-sm font-medium mb-2 ${field.error ? 'text-[#F58634]' : 'text-[#6E7C72]'}`}>
                      {field.label}
                      {field.error && (
                        <span className="ml-2 text-xs bg-[#F58634]/10 text-[#F58634] px-2 py-0.5 rounded-full">
                          Error
                        </span>
                      )}
                    </div>
                    <div className={`h-10 rounded-lg border ${field.error ? 'border-[#F58634] bg-[#F58634]/5' : 'border-[#E6E3DE] bg-[#FAF9F7]'}`}></div>
                    {field.error && (
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#F58634] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✗</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Icono de alerta */}
              <div className="absolute -top-3 -right-3 w-14 h-14 bg-gradient-to-br from-[#F58634] to-[#BD7D4A] rounded-full flex items-center justify-center shadow-lg">
                <div className="text-white text-xl">!</div>
              </div>

              {/* Línea diagonal decorativa */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-0.5 bg-gradient-to-r from-transparent via-[#F58634]/30 to-transparent rotate-45"></div>
              </div>
            </div>

            {/* Etiqueta flotante */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-[#E6E3DE] px-4 py-2 rounded-full shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#F58634]"></div>
                <span className="text-sm font-medium text-[#2C3E34]">Revisión requerida</span>
              </div>
            </div>
          </div>

          {/* Información y solución */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 font-serif text-[#2C3E34]">
                Datos mal estructurados
              </h2>
              <p className="text-[#6E7C72] leading-relaxed">
                La información enviada no cumple con los estándares de formato requeridos. 
                Como en una dieta balanceada, cada dato debe estar en su lugar correcto 
                y en la proporción adecuada.
              </p>
            </div>

            {/* Lista de problemas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold font-serif text-[#6B8E7B]">
                Problemas detectados:
              </h3>
              <ul className="space-y-3">
                {[
                  'Campos obligatorios incompletos',
                  'Formato de correo electrónico inválido',
                  'Números de teléfono incorrectos',
                  'Caracteres no permitidos en los campos'
                ].map((issue, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-[#F58634]/10 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F58634]"></div>
                    </div>
                    <span className="text-[#6E7C72]">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solución */}
            <div className="bg-gradient-to-br from-[#6B8E7B]/5 to-[#A8CF45]/5 rounded-xl p-6 border border-[#6B8E7B]/20">
              <h3 className="text-lg font-semibold mb-4 font-serif text-[#6B8E7B]">
                Solución recomendada:
              </h3>
              <ol className="space-y-3">
                {[
                  'Revisa que todos los campos obligatorios estén completos',
                  'Verifica el formato de tu correo electrónico',
                  'Asegúrate de que los números sean válidos',
                  'Elimina caracteres especiales no permitidos'
                ].map((step, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-white border border-[#6B8E7B] flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                      <span className="text-[#6B8E7B] text-sm font-bold">{index + 1}</span>
                    </div>
                    <span className="text-[#6E7C72]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Acciones */}
            <div className="pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 bg-white border border-[#6B8E7B] text-[#6B8E7B] font-semibold px-6 py-3 rounded-lg hover:bg-[#6B8E7B] hover:text-white transition-all duration-300 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Volver y corregir</span>
                </button>

                <Link
                  href="/"
                  className="flex-1 bg-gradient-to-r from-[#6B8E7B] to-[#4a7768] text-white font-semibold px-6 py-3 rounded-lg hover:shadow-md transition-all duration-300 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Ir al inicio</span>
                </Link>
              </div>
              
              <p className="text-sm text-[#6E7C72] mt-4 text-center">
                ¿Necesitas ayuda? <a href="mailto:ayuda@consultorio.com" className="text-[#6B8E7B] hover:underline">
                  Contáctanos
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-[#E6E3DE] text-center">
          <p className="text-sm text-[#6E7C72]">
            Consultorio Nutricional • Procesamiento seguro de datos • 
            <span className="ml-2 text-[#A8CF45]">✓ Certificado SSL</span>
          </p>
        </div>
      </div>
    </main>
  );
}