import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF9F7] p-6">
      <div className="max-w-4xl w-full">
        {/* Encabezado con logo sutil */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#6B8E7B]/10 to-[#6B8E7B]/5 mb-6">
            <div className="text-3xl">🥗</div>
          </div>
          <h1 className="text-7xl md:text-8xl font-bold font-serif text-[#6B8E7B]">
            404
          </h1>
          <p className="text-lg text-[#6E7C72] mt-4 max-w-md mx-auto">
            Página no encontrada en el consultorio nutricional
          </p>
        </div>

        {/* Contenido principal con ilustración */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Ilustración */}
          <div className="relative">
            {/* Fruta principal */}
            <div className="relative w-64 h-64 mx-auto">
              {/* Fondo orgánico */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#6B8E7B]/5 to-[#BD7D4A]/5 rounded-[40%_60%_60%_40%/60%_40%_60%_40%] animate-[morph_8s_ease-in-out_infinite]"></div>
              
              {/* Brócoli "perdido" */}
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <div className="text-8xl animate-[float_3s_ease-in-out_infinite]">🥦</div>
                
                {/* Líneas de búsqueda */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 border-2 border-[#E6E3DE] border-dashed rounded-full animate-pulse"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 border border-[#E6E3DE] border-dashed rounded-full animate-pulse animate-delay-500"></div>
                
                {/* Signos de interrogación */}
                <div className="absolute -top-2 -left-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <span className="text-[#F58634] font-bold">?</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <span className="text-[#F58634] font-bold">?</span>
                </div>
              </div>
            </div>
            
            {/* Elementos decorativos */}
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-br from-[#A8CF45]/10 to-[#6B8E7B]/10 rounded-full"></div>
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-[#BD7D4A]/10 to-[#F58634]/10 rounded-full"></div>
          </div>

          {/* Texto y acción */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-4 font-serif text-[#2C3E34]">
                Contenido no disponible
              </h2>
              <p className="text-[#6E7C72] leading-relaxed">
                Parece que la página que buscas ha sido movida o no existe. 
                En nuestro consultorio, cada elemento tiene su lugar específico 
                para garantizar el mejor cuidado nutricional.
              </p>
            </div>

            {/* Sugerencias */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold font-serif text-[#6B8E7B]">
                Te sugerimos:
              </h3>
              <ul className="space-y-3">
                {[
                  'Verificar la URL ingresada',
                  'Navegar desde nuestro menú principal',
                  'Contactarnos si necesitas ayuda específica'
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-[#A8CF45]/20 flex items-center justify-center mr-3 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-[#A8CF45]"></div>
                    </div>
                    <span className="text-[#6E7C72]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botón principal */}
            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center bg-[#6B8E7B] text-white font-semibold px-8 py-4 rounded-lg hover:bg-[#5a7d6a] transition-all duration-300 group shadow-sm hover:shadow-md"
              >
                <span>Regresar al inicio</span>
                <svg className="w-5 h-5 ml-3 transform group-hover:translate-x-1 transition-transform" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <p className="text-sm text-[#6E7C72] mt-3">
                O utiliza el menú de navegación para encontrar lo que buscas
              </p>
            </div>
          </div>
        </div>

        {/* Footer sutil */}
        <div className="mt-16 pt-8 border-t border-[#E6E3DE] text-center">
          <p className="text-sm text-[#6E7C72]">
            Consultorio Nutricional • {new Date().getFullYear()} • 
            <a href="mailto:contacto@consultorio.com" className="text-[#6B8E7B] hover:text-[#5a7d6a] ml-2">
              contacto@consultorio.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}