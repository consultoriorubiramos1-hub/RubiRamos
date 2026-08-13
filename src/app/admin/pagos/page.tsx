import {
  getPendingPaymentAppointments,
} from '@/lib/payment-review-actions';

import PendingPaymentsReview from '@/components/citas/PendingPaymentsReview';


export const dynamic =
  'force-dynamic';


export const metadata = {
  title:
    'Administración de pagos',
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


export default async function PaymentsPage() {
  const pendingPaymentAppointments =
    await getPendingPaymentAppointments();


  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          {/* Encabezado */}
          <div className="mb-6">
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#BD7D4A]/15
                  text-[#BD7D4A]
                "
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2 10h20M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zm3 8h3"
                  />
                </svg>
              </div>

              <div>
                <h1
                  className="
                    text-2xl
                    font-bold
                    text-[#5A8C7A]
                  "
                >
                  Administración de pagos
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
            </div>
          </div>


          {/* Resumen */}
          <div
            className="
              mb-6
              grid
              grid-cols-1
              gap-4
              md:grid-cols-3
            "
          >
            <div
              className="
                rounded-xl
                border-l-4
                border-[#BD7D4A]
                bg-white
                p-4
                shadow-sm
              "
            >
              <p
                className="
                  text-sm
                  font-medium
                  text-[#6E7C72]
                "
              >
                Comprobantes pendientes
              </p>

              <p
                className="
                  mt-1
                  text-2xl
                  font-bold
                  text-[#2C3E34]
                "
              >
                {pendingPaymentAppointments.length}
              </p>
            </div>


            <div
              className="
                rounded-xl
                border-l-4
                border-[#6B8E7B]
                bg-white
                p-4
                shadow-sm
              "
            >
              <p
                className="
                  text-sm
                  font-medium
                  text-[#6E7C72]
                "
              >
                Estado del módulo
              </p>

              <p
                className="
                  mt-1
                  text-lg
                  font-bold
                  text-[#6B8E7B]
                "
              >
                Revisión activa
              </p>
            </div>


            <div
              className="
                rounded-xl
                border-l-4
                border-[#A8CF45]
                bg-white
                p-4
                shadow-sm
              "
            >
              <p
                className="
                  text-sm
                  font-medium
                  text-[#6E7C72]
                "
              >
                Anticipo configurado
              </p>

              <p
                className="
                  mt-1
                  text-lg
                  font-bold
                  text-[#2C3E34]
                "
              >
                $100.00 MXN
              </p>
            </div>
          </div>


          <PendingPaymentsReview
            initialAppointments={
              pendingPaymentAppointments
            }
          />
        </div>
      </div>
    </div>
  );
}