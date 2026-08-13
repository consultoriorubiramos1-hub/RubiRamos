"use client";
import Link from "next/link";
export default function InternalServerError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF9F7] p-6">
      <div className="max-w-4xl w-full">
        {/* Encabezado minimalista */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#BD7D4A]/10 to-[#F58634]/5 mb-8 border-2 border-[#BD7D4A]/20">
            <div className="text-4xl">⚡</div>
          </div>
          <h1 className="text-7xl md:text-8xl font-bold font-serif text-[#BD7D4A]">
            500
          </h1>
          <p className="text-lg text-[#6E7C72] mt-4 max-w-md mx-auto">
            Error interno del sistema nutricional
          </p>
        </div>

        {/* Contenido principal */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Diagnóstico visual */}
          <div className="relative">
            {/* Gráfico de diagnóstico */}
            <div className="relative bg-white rounded-2xl p-8 shadow-sm border border-[#E6E3DE]">
              {/* Título del gráfico */}
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-semibold font-serif text-[#2C3E34]">
                  Diagnóstico del sistema
                </h3>
                <div className="text-xs font-medium px-3 py-1 rounded-full bg-[#F58634]/10 text-[#F58634]">
                  CRÍTICO
                </div>
              </div>

              {/* Barras de métricas */}
              <div className="space-y-6">
                {[
                  { label: 'Procesamiento', value: 35, color: '#F58634' },
                  { label: 'Memoria', value: 65, color: '#BD7D4A' },
                  { label: 'Conexión', value: 85, color: '#6B8E7B' },
                  { label: 'Respuesta', value: 25, color: '#F58634' },
                ].map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6E7C72]">{metric.label}</span>
                      <span className="font-medium" style={{ color: metric.color }}>
                        {metric.value}%
                      </span>
                    </div>
                    <div className="h-2 bg-[#FAF9F7] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${metric.value}%`,
                          backgroundColor: metric.color,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Icono de error */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-[#F58634] to-[#BD7D4A] rounded-full flex items-center justify-center shadow-lg">
                <div className="text-white text-2xl">!</div>
              </div>
            </div>

            {/* Elementos decorativos */}
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-[#A8CF45]/20 to-[#6B8E7B]/20 rounded-lg rotate-12"></div>
            <div className="absolute -top-4 -right-4 w-10 h-10 bg-gradient-to-br from-[#F58634]/10 to-[#BD7D4A]/10 rounded-full"></div>
          </div>

          {/* Información y acciones */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 font-serif text-[#2C3E34]">
                Sistema en mantenimiento
              </h2>
              <p className="text-[#6E7C72] leading-relaxed">
                Nuestro sistema nutricional está experimentando dificultades técnicas 
                inesperadas. Nuestro equipo especializado ya está trabajando para 
                restablecer el servicio lo antes posible.
              </p>
            </div>

            {/* Detalles técnicos (acordeón) */}
            <div className="bg-white rounded-xl border border-[#E6E3DE] overflow-hidden">
              <details className="group">
                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#FAF9F7] transition-colors">
                  <span className="text-[#6B8E7B] font-semibold">Detalles técnicos</span>
                  <svg className="w-5 h-5 text-[#6E7C72] transform group-open:rotate-180 transition-transform" 
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="p-4 pt-0">
                  <div className="bg-[#FAF9F7] rounded-lg p-4 font-mono text-sm">
                    <code className="text-[#6E7C72] break-words">
                      {error.message || "Error interno del servidor"}
                    </code>
                  </div>
                </div>
              </details>
            </div>

            {/* Acciones */}
            <div className="space-y-4">
              <button
                onClick={() => reset()}
                className="w-full bg-gradient-to-r from-[#BD7D4A] to-[#F58634] text-white font-semibold px-6 py-4 rounded-lg hover:shadow-md transition-all duration-300 flex items-center justify-center group"
              >
                <svg className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reintentar operación</span>
              </button>

              <Link
                href="/"
                className="w-full bg-white border border-[#6B8E7B] text-[#6B8E7B] font-semibold px-6 py-4 rounded-lg hover:bg-[#6B8E7B] hover:text-white transition-all duration-300 flex items-center justify-center group shadow-sm"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Volver al inicio</span>
              </Link>

              <a
                href="mailto:soporte@consultorio.com"
                className="w-full bg-white border border-[#E6E3DE] text-[#6E7C72] font-medium px-6 py-4 rounded-lg hover:border-[#BD7D4A] hover:text-[#BD7D4A] transition-all duration-300 flex items-center justify-center text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2" />
                </svg>
                <span>Contactar soporte técnico</span>
              </a>
            </div>
          </div>
        </div>

        {/* Mensaje tranquilizador */}
        <div className="mt-12 pt-8 border-t border-[#E6E3DE]">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#A8CF45]/10 mb-4">
              <div className="text-[#A8CF45] text-xl">✓</div>
            </div>
            <p className="text-[#6E7C72]">
              Mientras restablecemos el sistema, recuerda que tu salud nutricional 
              sigue siendo nuestra prioridad. Pronto estaremos de vuelta.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}