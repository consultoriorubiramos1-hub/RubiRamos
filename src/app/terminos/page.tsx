import type { Metadata } from 'next';
import LegalPageLayout, { type LegalSection } from '@/components/LegalPageLayout/legalPageLayout';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Condiciones generales de uso del sitio del Consultorio Nutricional Rubí Ramos.',
};

const sections: LegalSection[] = [
  {
    subtitle: 'Uso del sitio',
    paragraphs: ['Este sitio ofrece información sobre el consultorio y sus servicios. Al utilizarlo, procura proporcionar información veraz y hacer un uso respetuoso de sus funciones.'],
  },
  {
    subtitle: 'Información de salud',
    paragraphs: ['El contenido publicado tiene fines informativos y no sustituye una consulta nutricional profesional personalizada. Las recomendaciones individuales requieren una evaluación de cada persona.'],
  },
  {
    subtitle: 'Cuentas de acceso',
    paragraphs: ['Algunas funciones requieren una cuenta autorizada. Quien disponga de una cuenta debe cuidar sus credenciales y comunicar al consultorio cualquier uso no reconocido.'],
  },
  {
    subtitle: 'Citas',
    paragraphs: ['La solicitud y gestión de citas depende de la disponibilidad y de los canales habilitados por el consultorio. Para conocer horarios o resolver dudas, utiliza los datos de contacto publicados en el sitio.'],
  },
  {
    subtitle: 'Responsabilidades del usuario',
    paragraphs: ['El usuario debe utilizar el sitio de forma adecuada, mantener actualizados los datos que facilite cuando sea necesario y evitar acciones que afecten su funcionamiento o la información de otras personas.'],
  },
  {
    subtitle: 'Contenido del sitio',
    paragraphs: ['Los textos, imágenes y demás materiales del sitio corresponden a sus respectivos titulares. Su publicación no autoriza su reproducción o uso fuera de los permisos aplicables.'],
  },
  {
    subtitle: 'Disponibilidad del servicio',
    paragraphs: ['El acceso al sitio o a alguna de sus funciones puede interrumpirse temporalmente por mantenimiento o por circunstancias técnicas.'],
  },
  {
    subtitle: 'Modificaciones',
    paragraphs: ['Estos términos pueden actualizarse para reflejar cambios en el sitio o sus servicios. La versión vigente estará disponible en esta página.'],
  },
  {
    subtitle: 'Contacto',
    paragraphs: ['Si tienes preguntas sobre el uso del sitio, escribe a contacto@rubinutricion.com o llama al +52 77 1720 6956.'],
  },
];

export default function TerminosPage() {
  return (
    <LegalPageLayout
      title="Términos y Condiciones"
      introduction="Estas condiciones explican el uso general del sitio y de las funciones disponibles del consultorio."
      sections={sections}
    />
  );
}
