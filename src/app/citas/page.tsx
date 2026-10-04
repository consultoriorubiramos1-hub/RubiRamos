import type { Metadata } from 'next';
import Link from 'next/link';
import { ClockIcon, EnvelopeIcon, MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Agenda tu Cita',
  description: 'Consulta el horario y los datos de contacto para agendar una cita en el Consultorio Nutricional Rubí Ramos.',
};

export default function CitasPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] px-5 py-16 text-[#2C3E34] sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <p className="mb-3 font-semibold uppercase tracking-widest text-[#BD7D4A]">Consultorio nutricional</p>
          <h1 className="mb-5 font-serif text-4xl font-bold sm:text-5xl">Agenda tu Cita</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#6E7C72]">
            Para solicitar una cita, comunícate con el consultorio y consulta la disponibilidad.
            Si ya tienes acceso al sistema, puedes iniciar sesión para continuar con tus citas.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <section className="rounded-2xl border border-[#E6E3DE] bg-white p-7 shadow-sm sm:p-9">
            <h2 className="mb-5 font-serif text-2xl font-bold">Cómo comenzar</h2>
            <ol className="space-y-5 text-[#6E7C72]">
              <li className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7CB38C] font-bold text-white">1</span><span>Contáctanos por teléfono o correo para consultar la disponibilidad de una primera cita.</span></li>
              <li className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7CB38C] font-bold text-white">2</span><span>Acuerda con el consultorio el horario de atención que mejor se ajuste a tus necesidades.</span></li>
              <li className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7CB38C] font-bold text-white">3</span><span>Si ya cuentas con acceso, entra al sistema para consultar y gestionar tus citas.</span></li>
            </ol>
            <Link href="/login" className="mt-8 inline-flex rounded-xl bg-[#F58634] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#BD7D4A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E34]">
              Iniciar sesión
            </Link>
          </section>

          <section className="rounded-2xl border border-[#E6E3DE] bg-white p-7 shadow-sm sm:p-9">
            <h2 className="mb-5 font-serif text-2xl font-bold">Horario y contacto</h2>
            <ul className="space-y-6 text-[#6E7C72]">
              <li className="flex min-w-0 gap-4"><ClockIcon className="h-6 w-6 shrink-0 text-[#5A8C7A]" aria-hidden="true" /><span><strong className="block text-[#2C3E34]">Horario</strong>Lunes a viernes, 8:00 a 18:00 h</span></li>
              <li className="flex min-w-0 gap-4"><PhoneIcon className="h-6 w-6 shrink-0 text-[#5A8C7A]" aria-hidden="true" /><span><strong className="block text-[#2C3E34]">Teléfono</strong><a href="tel:+527717206956" className="break-words hover:text-[#BD7D4A] hover:underline">+52 77 1720 6956</a></span></li>
              <li className="flex min-w-0 gap-4"><EnvelopeIcon className="h-6 w-6 shrink-0 text-[#5A8C7A]" aria-hidden="true" /><span className="min-w-0"><strong className="block text-[#2C3E34]">Correo</strong><a href="mailto:contacto@rubinutricion.com" className="break-all hover:text-[#BD7D4A] hover:underline">contacto@rubinutricion.com</a></span></li>
              <li className="flex min-w-0 gap-4"><MapPinIcon className="h-6 w-6 shrink-0 text-[#5A8C7A]" aria-hidden="true" /><span><strong className="block text-[#2C3E34]">Ubicación</strong>C. Juan Mogica Ugalde #10, Huejutla de Reyes<br />Clínica Huejutla, piso 2, consultorio 14</span></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
