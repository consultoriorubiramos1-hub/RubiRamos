import type { Metadata } from 'next';
import Link from 'next/link';
import { BeakerIcon, DocumentTextIcon, HeartIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import FeatureCard from '@/components/FeatureCard/featureCard';

export const metadata: Metadata = {
  title: 'Servicios',
  description: 'Servicios de consulta, evaluación, planes alimenticios y seguimiento del Consultorio Nutricional Rubí Ramos.',
};

const servicios = [
  {
    icon: UserCircleIcon,
    title: 'Consulta Nutricional Inicial',
    description: 'Evaluación completa personalizada con historial clínico y establecimiento de objetivos claros.',
  },
  {
    icon: BeakerIcon,
    title: 'Evaluación Antropométrica',
    description: 'Control profesional de peso, porcentaje de grasa, músculo, agua y grasa visceral.',
  },
  {
    icon: DocumentTextIcon,
    title: 'Planes Alimenticios Personalizados',
    description: 'Elaboración manual de planes alimenticios adaptados a tus necesidades específicas.',
  },
  {
    icon: HeartIcon,
    title: 'Seguimiento Nutricional',
    description: 'Control mensual de progreso con ajustes continuos para optimizar resultados.',
  },
];

export default function ServiciosPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] px-5 py-16 text-[#2C3E34] sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 font-semibold uppercase tracking-widest text-[#BD7D4A]">Atención personalizada</p>
          <h1 className="mb-5 font-serif text-4xl font-bold sm:text-5xl">Servicios</h1>
          <p className="text-lg leading-relaxed text-[#6E7C72]">
            Atención nutricional adaptada a las necesidades y objetivos de cada paciente.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {servicios.map((servicio) => <FeatureCard key={servicio.title} {...servicio} />)}
        </div>
        <div className="mt-14 rounded-2xl border border-[#E6E3DE] bg-white p-5 sm:p-8 text-center">
          <h2 className="mb-3 font-serif text-2xl font-bold">¿Te gustaría recibir orientación nutricional?</h2>
          <p className="mb-6 text-[#6E7C72]">Consulta cómo agendar una cita y los medios de contacto del consultorio.</p>
          <Link href="/citas" className="inline-flex rounded-xl bg-[#F58634] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#BD7D4A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E34]">
            Agenda tu cita
          </Link>
        </div>
      </div>
    </div>
  );
}
