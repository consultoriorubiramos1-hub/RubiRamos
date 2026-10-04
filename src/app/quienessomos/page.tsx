import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre Mí',
  description: 'Conoce a la Lic. Rubí Ramos Álvarez y el enfoque de atención de su consultorio nutricional.',
};

const valores = ['Profesionalismo', 'Responsabilidad', 'Confidencialidad', 'Empatía', 'Compromiso', 'Calidad'];

export default function QuienesSomosPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#2C3E34]">
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:py-20">
        <div>
          <p className="mb-3 font-semibold uppercase tracking-widest text-[#BD7D4A]">Consultorio nutricional</p>
          <h1 className="mb-6 font-serif text-4xl font-bold sm:text-5xl">Sobre Mí</h1>
          <p className="mb-5 text-xl font-semibold text-[#5A8C7A]">Lic. Rubí Ramos Álvarez</p>
          <p className="max-w-2xl text-lg leading-relaxed text-[#6E7C72]">
            En el consultorio brindamos atención nutricional integral mediante evaluaciones personalizadas,
            planes alimenticios adecuados y asesoría profesional. Cada proceso se orienta a las necesidades
            y objetivos de la persona que consulta.
          </p>
          <Link href="/servicios" className="mt-8 inline-flex rounded-xl bg-[#5A8C7A] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#2C3E34] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E34]">
            Conoce los servicios
          </Link>
        </div>
        <div className="mx-auto w-full max-w-sm rounded-3xl border border-[#E6E3DE] bg-white p-4 shadow-lg">
          <Image
            src="/rubiramos.png"
            alt="Lic. Rubí Ramos Álvarez"
            width={510}
            height={822}
            className="mx-auto h-auto max-h-[32rem] w-auto max-w-full rounded-2xl object-contain"
            sizes="(max-width: 1024px) 100vw, 384px"
          />
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center font-serif text-3xl font-bold">Nuestro enfoque</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <article className="rounded-2xl border border-[#E6E3DE] bg-[#FAF9F7] p-7">
              <h3 className="mb-4 font-serif text-xl font-bold text-[#5A8C7A]">Misión</h3>
              <p className="leading-relaxed text-[#6E7C72]">
                Brindar atención nutricional integral a personas de distintas edades mediante evaluaciones
                personalizadas, planes alimenticios adecuados y asesoría profesional, contribuyendo a la mejora
                de la salud, el bienestar y la calidad de vida.
              </p>
            </article>
            <article className="rounded-2xl border border-[#E6E3DE] bg-[#FAF9F7] p-7">
              <h3 className="mb-4 font-serif text-xl font-bold text-[#BD7D4A]">Visión</h3>
              <p className="leading-relaxed text-[#6E7C72]">
                Consolidarnos como un consultorio nutricional de referencia a nivel regional, reconocido por
                la calidad de su atención, el profesionalismo en sus servicios y el impacto positivo en los
                hábitos alimenticios y la salud de nuestros pacientes.
              </p>
            </article>
            <article className="rounded-2xl border border-[#E6E3DE] bg-[#FAF9F7] p-7">
              <h3 className="mb-4 font-serif text-xl font-bold text-[#F58634]">Valores</h3>
              <ul className="space-y-2 text-[#6E7C72]">
                {valores.map((valor) => (
                  <li key={valor} className="flex items-center gap-3">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#A8CF45]" aria-hidden="true" />
                    {valor}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
