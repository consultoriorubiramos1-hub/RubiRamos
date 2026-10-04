import type { Metadata } from 'next';
import LegalPageLayout, { type LegalSection } from '@/components/LegalPageLayout/legalPageLayout';

export const metadata: Metadata = {
  title: 'Aviso de Privacidad',
  description: 'Información general sobre el tratamiento de datos personales en el Consultorio Nutricional Rubí Ramos.',
};

const sections: LegalSection[] = [
  {
    subtitle: 'Responsable del tratamiento',
    paragraphs: ['La Lic. Rubí Ramos Álvarez, a través de su consultorio nutricional, es responsable del tratamiento de los datos personales que se proporcionen al solicitar atención o utilizar las funciones del sitio.'],
  },
  {
    subtitle: 'Datos que pueden recopilarse',
    paragraphs: ['Según la interacción con el consultorio o el sistema, pueden solicitarse datos de identificación y contacto, así como información necesaria para gestionar cuentas, citas y atención nutricional.'],
  },
  {
    subtitle: 'Finalidades',
    paragraphs: ['Los datos se utilizan para responder consultas, organizar citas, prestar servicios nutricionales, dar seguimiento a la atención y mantener los registros relacionados con ella.'],
  },
  {
    subtitle: 'Información de salud y nutrición',
    paragraphs: ['La atención puede requerir antecedentes, hábitos alimenticios, mediciones antropométricas y datos de evolución. Esta información se trata con confidencialidad y se utiliza para la evaluación, la elaboración de planes alimenticios y el seguimiento nutricional.'],
  },
  {
    subtitle: 'Protección y confidencialidad',
    paragraphs: ['El consultorio procura limitar el acceso a los datos al personal autorizado y aplicar medidas razonables para protegerlos frente a usos o accesos no autorizados.'],
  },
  {
    subtitle: 'Proveedores tecnológicos',
    paragraphs: ['Para operar el sitio y sus herramientas pueden intervenir proveedores de servicios tecnológicos, como alojamiento o comunicaciones. Su intervención se limita a las funciones necesarias para prestar esos servicios.'],
  },
  {
    subtitle: 'Solicitudes relacionadas con tus datos',
    paragraphs: ['Puedes solicitar información sobre tus datos, pedir su corrección o plantear una solicitud relacionada con su uso o eliminación escribiendo a contacto@rubinutricion.com. El consultorio revisará la solicitud según corresponda.'],
  },
  {
    subtitle: 'Contacto',
    paragraphs: ['Para consultas sobre este aviso, escribe a contacto@rubinutricion.com o llama al +52 77 1720 6956.'],
  },
  {
    subtitle: 'Cambios al aviso',
    paragraphs: ['Este aviso puede actualizarse cuando cambien las prácticas del consultorio o las funciones del sitio. La versión vigente se publicará en esta página.'],
  },
];

export default function PoliticasPage() {
  return (
    <LegalPageLayout
      title="Aviso de Privacidad"
      introduction="Conoce de forma general cómo se utilizan y protegen los datos que compartes con el consultorio."
      sections={sections}
    />
  );
}
