import {
    KeyIcon,
    SpeakerWaveIcon
} from '@heroicons/react/24/outline';

interface AlexaCommand {
    intent: string;
    utterances: string[];
    function: string;
}

const alexaCommands: AlexaCommand[] = [
    {
        intent: 'AMAZON.CancelIntent',
        utterances: [
            'cancelar',
            'cancela'
        ],
        function:
            'Cancela la operación actual de la skill.'
    },
    {
        intent: 'AMAZON.HelpIntent',
        utterances: [
            'cómo funciona',
            'dime las opciones',
            'qué puedes hacer',
            'ayuda'
        ],
        function:
            'Muestra las opciones y los comandos disponibles en NutriControl.'
    },
    {
        intent: 'AMAZON.StopIntent',
        utterances: [
            'adiós',
            'terminar',
            'finalizar',
            'salir'
        ],
        function:
            'Finaliza la interacción y cierra la skill.'
    },
    {
        intent: 'AMAZON.FallbackIntent',
        utterances: [
            'Cualquier frase que Alexa no reconozca'
        ],
        function:
            'Informa que la solicitud no fue entendida y recomienda comandos válidos.'
    },
    {
        intent: 'ValidarTokenIntent',
        utterances: [
            'asistente nutricional',
            'mi token es asistente nutricional',
            'el token es asistente nutricional',
            'mi token es {token}',
            'el token es {token}',
            'validar token {token}',
            'usar token {token}',
            'token {token}'
        ],
        function:
            'Valida el token de acceso antes de permitir el uso de NutriControl.'
    },
    {
        intent: 'DailyAppointmentsIntent',
        utterances: [
            'mis citas de hoy',
            'dime mis consultas de hoy',
            'cuántas consultas tengo hoy',
            'cuántos pacientes tengo hoy',
            'consulta mis citas del día',
            'cuántas citas tengo hoy',
            'dime cuántas citas tengo hoy',
            'consultar citas de hoy'
        ],
        function:
            'Consulta y muestra la cantidad de citas programadas para el día actual.'
    },
    {
        intent: 'AppointmentsByDateIntent',
        utterances: [
            'qué citas tengo {fecha}',
            'cuántas citas tengo {fecha}',
            'dime mis citas de {fecha}',
            'dime mis citas para {fecha}',
            'consulta mis citas de {fecha}',
            'consulta mis citas para {fecha}',
            'muéstrame las citas de {fecha}',
            'qué pacientes tengo {fecha}',
            'cuántos pacientes tengo {fecha}',
            'cuántas consultas tengo {fecha}',
            'cuál es mi agenda de {fecha}',
            'cuál es mi agenda para {fecha}',
            'muéstrame la agenda de {fecha}',
            'agenda de {fecha}',
            'mis citas para {fecha}'
        ],
        function:
            'Consulta las citas programadas para la fecha indicada.'
    },
    {
        intent: 'NextPatientIntent',
        utterances: [
            'quién es el próximo paciente',
            'siguiente paciente',
            'quién sigue en consulta',
            'qué paciente sigue',
            'dime quién sigue',
            'consultar siguiente paciente'
        ],
        function:
            'Muestra el nombre y la hora del siguiente paciente pendiente.'
    },
    {
        intent: 'TodayScheduleIntent',
        utterances: [
            'ver agenda',
            'mi agenda',
            'escuchar agenda',
            'cuáles son mis citas',
            'consulta mi agenda',
            'dime mis horarios',
            'cuál es mi agenda de hoy',
            'muéstrame la agenda',
            'dime la agenda de hoy'
        ],
        function:
            'Consulta y muestra la agenda de citas pendientes del día.'
    },
    {
        intent: 'FinishConsultationIntent',
        utterances: [
            'marcar consulta finalizada',
            'consulta terminada',
            'finalizar consulta',
            'terminar consulta',
            'completar consulta',
            'marcar como finalizada'
        ],
        function:
            'Marca la siguiente consulta pendiente como finalizada en la base de datos.'
    }
];

export default function AlexaNutriControlPage() {
    return (
        <div className="min-h-screen bg-[#FAF9F7] p-4 sm:p-6">
            <div className="mx-auto max-w-7xl">
                {/* Encabezado */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5A8C7A]">
                            <SpeakerWaveIcon className="h-7 w-7 text-white" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-[#2C3E34]">
                                Alexa NutriControl
                            </h1>

                            <p className="mt-1 text-sm text-[#6E7C72]">
                                Información de acceso y comandos disponibles.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cuadro informativo del token */}
                <section className="mb-8 overflow-hidden rounded-2xl border border-[#DCE7DF] bg-white shadow-sm">
                    <div className="flex items-center gap-4 p-5 sm:p-6">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FFF2E8]">
                            <KeyIcon className="h-7 w-7 text-[#F58634]" />
                        </div>

                        <div>
                            <p className="text-sm font-medium text-[#6E7C72]">
                                Token de acceso de la skill
                            </p>

                            <p className="mt-1 text-lg font-semibold text-[#2C3E34] sm:text-xl">
                                El token es:{' '}
                                <span className="text-[#5A8C7A]">
                                    asistente nutricional
                                </span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* Tabla */}
                <section className="overflow-hidden rounded-2xl border border-[#DCE7DF] bg-white shadow-sm">
                    <div className="border-b border-[#E5ECE7] px-5 py-4 sm:px-6">
                        <h2 className="text-lg font-semibold text-[#2C3E34]">
                            Utterances y funciones
                        </h2>

                        <p className="mt-1 text-sm text-[#6E7C72]">
                            Frases que reconoce Alexa y la función que realiza cada una.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="bg-[#2C3E34] text-left text-sm text-white">
                                    <th className="w-1/2 px-5 py-4 font-semibold sm:px-6">
                                        Utterances
                                    </th>

                                    <th className="w-1/2 px-5 py-4 font-semibold sm:px-6">
                                        ¿Qué hace?
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-[#E5ECE7]">
                                {alexaCommands.map((command, index) => (
                                    <tr
                                        key={command.intent}
                                        className={
                                            index % 2 === 0
                                                ? 'bg-white'
                                                : 'bg-[#FAFCFA]'
                                        }
                                    >
                                        <td className="align-top px-5 py-5 sm:px-6">
                                            <p className="mb-3 text-xs font-semibold text-[#5A8C7A]">
                                                {command.intent}
                                            </p>

                                            <ul className="space-y-1.5">
                                                {command.utterances.map(
                                                    (utterance) => (
                                                        <li
                                                            key={utterance}
                                                            className="flex gap-2 text-sm text-[#4E5E54]"
                                                        >
                                                            <span className="text-[#F58634]">
                                                                •
                                                            </span>

                                                            <span>
                                                                {utterance}
                                                            </span>
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </td>

                                        <td className="align-top px-5 py-5 text-sm leading-6 text-[#4E5E54] sm:px-6">
                                            {command.function}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}