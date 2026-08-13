import {
  Suspense,
} from 'react';

import {
  getTodayAppointmentsWithPatients,
} from '@/lib/clinical-evaluations-actions';

import CitasClient from '@/components/citas/CitasClient';


export const dynamic =
  'force-dynamic';


export const metadata = {
  title:
    'Citas del día',
};


function getCurrentDateText(): string {
  return new Intl.DateTimeFormat(
    'es-MX',
    {
      timeZone:
        'America/Mexico_City',

      weekday:
        'long',

      year:
        'numeric',

      month:
        'long',

      day:
        'numeric',
    },
  ).format(
    new Date(),
  );
}


export default async function CitasPage() {
  const appointments =
    await getTodayAppointmentsWithPatients();


  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1
              className="
                text-2xl
                font-bold
                text-[#5A8C7A]
              "
            >
              Citas del día
            </h1>

            <p
              className="
                mt-1
                text-sm
                capitalize
                text-[#6E7C72]
              "
            >
              {getCurrentDateText()}
            </p>
          </div>


          <Suspense
            fallback={
              <div
                className="
                  rounded-xl
                  border
                  border-[#E6E3DE]
                  bg-white
                  py-10
                  text-center
                  text-[#6E7C72]
                "
              >
                Cargando citas...
              </div>
            }
          >
            <CitasClient
              initialAppointments={
                appointments
              }
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}