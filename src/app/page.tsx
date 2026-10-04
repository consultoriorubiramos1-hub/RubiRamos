import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  HeartIcon,
  UserCircleIcon,
  BeakerIcon,
  CalendarIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import FeatureCard from '@/components/FeatureCard/featureCard';

export const metadata: Metadata = {
  title: 'Consultorio Nutricional - Lic. Rubí Ramos Álvarez',
  description: 'Atención nutricional integral con evaluaciones personalizadas, planes alimenticios adecuados y asesoría profesional.',
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* HERO SECTION - CON FONDO Y FOTO DE LA DOCTORA */}
      <section className="relative min-h-[80svh] flex items-center justify-center overflow-hidden">
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/fondo_inicio.png"
            alt="Fondo consultorio nutricional"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          {/* Overlay para mejorar legibilidad */}
          <div className="absolute inset-0 bg-[#2C3E34]/80 backdrop-blur-[2px]"></div>
        </div>

        {/* Contenido sobre la imagen */}
        <div className="container mx-auto px-4 relative z-10 py-12 sm:py-16">
          <div className="max-w-6xl mx-auto">
            
            {/* Contenido principal - Foto y texto lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-center gap-8 lg:gap-12 mb-10">
              
              {/* Foto de la doctora - Izquierda */}
              <div className="min-w-0 flex justify-center p-4">
                <div className="relative w-full max-w-72 md:max-w-96">
                  {/* Marco decorativo detrás de la foto */}
                  <div className="absolute -top-4 -left-4 w-full h-full rounded-3xl bg-gradient-to-br from-[#BD7D4A] to-[#F58634] opacity-50"></div>
                  <div className="absolute -bottom-4 -right-4 w-full h-full rounded-3xl bg-gradient-to-br from-[#7CB38C] to-[#A8CF45] opacity-50"></div>
                  
                  {/* Contenedor de la foto - Tamaño fijo para que no se corte */}
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white/90 bg-white/10">
                    <Image
                      src="/rubiramos.png"
                      alt="Lic. Rubí Ramos Álvarez - Nutrióloga"
                      fill
                      className="object-contain"
                      priority
                      sizes="(max-width: 768px) 288px, (max-width: 1024px) 320px, 384px"
                    />
                  </div>
                  
                  {/* Badge flotante */}
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-5 py-2 shadow-lg whitespace-nowrap">
                    <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#2C3E34' }}>
                      <span>🥗</span> Nutrióloga Certificada
                    </span>
                  </div>
                </div>
              </div>

              {/* Texto - Derecha */}
              <div className="min-w-0 text-center md:text-left">
                <h1 className="text-[clamp(1.75rem,4vw,3rem)] leading-tight font-bold mb-3 font-serif" style={{ color: '#FFFFFF' }}>
                  Consultorio Nutricional
                </h1>
                <h2 className="text-xl md:text-3xl font-semibold mb-5" style={{ color: '#F58634' }}>
                  Nutrióloga Rubí Ramos Álvarez
                </h2>
                
                {/* Dirección */}
                <div className="inline-flex max-w-full items-start justify-center md:justify-start gap-3 bg-white/10 px-4 py-3 rounded-2xl mb-6 border border-white/30">
                  <MapPinIcon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#FFFFFF' }} />
                  <span className="text-xs md:text-sm" style={{ color: '#FFFFFF' }}>
                    C. Juan Mogica Ugalde #10, Huejutla de Reyes <p>
                      Clinica Huejutla, Piso 2, Consultorio 14
                    </p>
                  </span>
                </div>

                {/* Misión */}
                <div className="mb-8">
                  <p className="text-sm md:text-lg leading-relaxed" style={{ color: '#FFFFFF' }}>
                    <strong className="font-bold" style={{ color: '#BD7D4A' }}>Misión:</strong> Brindar atención nutricional integral a personas de distintas edades mediante evaluaciones personalizadas, planes alimenticios adecuados y asesoría profesional.
                  </p>
                </div>
                
                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link href="/citas"
                    className="px-6 py-3 rounded-xl font-bold text-sm md:text-base shadow-md transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ 
                      backgroundColor: '#F58634',
                      color: '#2C3E34'
                    }}
                  >
                    <CalendarIcon className="h-4 w-4 md:h-5 md:w-5" />
                    Agenda tu Primera Consulta
                  </Link>
                  <Link href="/servicios"
                    className="px-6 py-3 border-2 rounded-xl font-bold text-sm md:text-base transition-all duration-300 hover:bg-white/10 transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ 
                      borderColor: '#FFFFFF',
                      color: '#FFFFFF'
                    }}
                  >
                    <UserCircleIcon className="h-4 w-4 md:h-5 md:w-5" />
                    Conoce Nuestros Servicios
                  </Link>
                </div>
              </div>
            </div>

            {/* Información de contacto inmediata */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-md p-4 sm:p-6 border border-[#E6E3DE]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex min-w-0 items-center justify-start gap-3 p-2 rounded-xl hover:bg-[#FAF9F7] transition-colors">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#2C3E34' }}>
                    <PhoneIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold" style={{ color: '#6E7C72' }}>TELÉFONO</p>
                    <a href="tel:+527717206956" className="font-semibold text-sm md:text-base hover:underline" style={{ color: '#2C3E34' }}>+52 77 1720 6956</a>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 p-3 rounded-xl hover:bg-[#FAF9F7] transition-colors">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#7CB38C' }}>
                    <EnvelopeIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#6E7C72' }}>EMAIL</p>
                    <a href="mailto:contacto@rubinutricion.com" className="break-words font-semibold text-sm md:text-base hover:underline" style={{ color: '#2C3E34' }}>contacto@rubinutricion.com</a>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 p-3 rounded-xl hover:bg-[#FAF9F7] transition-colors">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#7CB38C' }}>
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: '#6E7C72' }}>HORARIO</p>
                    <p className="font-bold text-sm md:text-base" style={{ color: '#2C3E34' }}>Lun-Vie: 8am - 6pm</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS SECTION */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif" style={{ color: '#2C3E34' }}>
              Nuestros Servicios Profesionales
            </h2>
            <p className="text-lg md:text-xl max-w-3xl mx-auto" style={{ color: '#6E7C72' }}>
              Atención especializada adaptada a las necesidades específicas de cada paciente
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={UserCircleIcon}
              title="Consulta Nutricional Inicial"
              description="Evaluación completa personalizada con historial clínico y establecimiento de objetivos claros."
            />
            <FeatureCard
              icon={BeakerIcon}
              title="Evaluación Antropométrica"
              description="Control profesional de peso, porcentaje de grasa, músculo, agua y grasa visceral."
            />
            <FeatureCard
              icon={DocumentTextIcon}
              title="Planes Alimenticios Personalizados"
              description="Elaboración manual de planes alimenticios adaptados a tus necesidades específicas."
            />
            <FeatureCard
              icon={HeartIcon}
              title="Seguimiento Nutricional"
              description="Control mensual de progreso con ajustes continuos para optimizar resultados."
            />
          </div>
        </div>
      </section>

      {/* MISIÓN, VISIÓN Y VALORES */}
      <section className="py-20" style={{ backgroundColor: '#FAF9F7' }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div 
              className="ui-card p-5 sm:p-8 rounded-2xl"
              style={{ backgroundColor: '#FFFFFF' }}
            >
              <div className="h-14 w-14 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#7CB38C' }}>
                <StarIcon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 font-serif" style={{ color: '#2C3E34' }}>Misión</h3>
              <p className="leading-relaxed" style={{ color: '#6E7C72' }}>
                Brindar atención nutricional integral a personas de distintas edades mediante evaluaciones personalizadas, planes alimenticios adecuados y asesoría profesional, contribuyendo a la mejora de la salud, el bienestar y la calidad de vida.
              </p>
            </div>
            <div 
              className="p-5 sm:p-8 rounded-2xl shadow-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              style={{ backgroundColor: '#FFFFFF' }}
            >
              <div className="h-14 w-14 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#BD7D4A' }}>
                <ChartBarIcon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 font-serif" style={{ color: '#2C3E34' }}>Visión</h3>
              <p className="leading-relaxed" style={{ color: '#6E7C72' }}>
                Consolidarnos como un consultorio nutricional de referencia a nivel regional, reconocido por la calidad de su atención, el profesionalismo en sus servicios y el impacto positivo en los hábitos alimenticios y la salud de nuestros pacientes.
              </p>
            </div>
            <div 
              className="p-5 sm:p-8 rounded-2xl shadow-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              style={{ backgroundColor: '#FFFFFF' }}
            >
              <div className="h-14 w-14 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#F58634' }}>
                <ShieldCheckIcon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 font-serif" style={{ color: '#2C3E34' }}>Valores</h3>
              <ul className="space-y-2">
                {['Profesionalismo', 'Responsabilidad', 'Confidencialidad', 'Empatía', 'Compromiso', 'Calidad'].map((valor) => (
                  <li key={valor} className="flex items-center">
                    <div className="h-2 w-2 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: '#A8CF45' }}></div>
                    <span style={{ color: '#6E7C72' }}>{valor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* METAS Y ESTRATEGIAS */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold mb-8 font-serif text-center" style={{ color: '#2C3E34' }}>Nuestros Objetivos</h2>
              <div className="space-y-6">
                {[
                  'Proporcionar servicios de nutrición personalizados y de calidad',
                  'Promover hábitos alimenticios saludables en los pacientes',
                  'Mantener un seguimiento adecuado del progreso nutricional',
                  'Ofrecer atención organizada, puntual y profesional',
                  'Fortalecer la confianza y fidelidad de los pacientes'
                ].map((objetivo, index) => (
                  <div key={index} className="flex items-start p-4 rounded-xl hover:bg-[#FAF9F7] transition-colors">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0" style={{ backgroundColor: '#7CB38C' }}>
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <p className="text-lg" style={{ color: '#2C3E34' }}>{objetivo}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-8 font-serif text-center" style={{ color: '#2C3E34' }}>Nuestras Estrategias</h2>
              <div className="space-y-6">
                {[
                  'Realizar evaluaciones nutricionales completas y personalizadas',
                  'Diseñar planes alimenticios acordes a las necesidades de cada paciente',
                  'Fomentar la comunicación constante para el seguimiento nutricional',
                  'Mantener procesos claros para la atención y control de consultas',
                  'Ofrecer un trato cercano que genere confianza y permanencia'
                ].map((estrategia, index) => (
                  <div key={index} className="flex items-start p-4 rounded-xl hover:bg-[#FAF9F7] transition-colors">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0" style={{ backgroundColor: '#BD7D4A' }}>
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <p className="text-lg" style={{ color: '#2C3E34' }}>{estrategia}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16" style={{ backgroundColor: '#2C3E34' }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-serif" style={{ color: '#FFFFFF' }}>
            ¿Listo para transformar tu salud?
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: '#FFFFFF' }}>
            Agenda tu primera consulta y comienza tu camino hacia una vida más saludable con acompañamiento profesional.
          </p>
          <Link href="/citas"
            className="inline-flex min-h-12 items-center justify-center px-6 sm:px-12 py-4 rounded-xl font-bold text-lg shadow-md transition-all duration-300 hover:shadow-lg transform active:scale-[0.98]"
            style={{ 
              backgroundColor: '#F58634',
              color: '#2C3E34'
            }}
          >
            Comienza Hoy Mismo
          </Link>
        </div>
      </section>
    </div>
  );
}
