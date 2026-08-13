'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

type Direction = 'asc' | 'desc';
export interface FilterColumn { label: string; key: string }

export default function ResponsiveFilter({ columns }: { columns: FilterColumn[] }) {
  const searchParams = useSearchParams();
  const pathname     = usePathname();
  const router       = useRouter();

  const currentSort = searchParams.get('sort') ?? 'nombre';
  const currentDir  = searchParams.get('dir') === 'desc' ? 'desc' : 'asc';

  const [open, setOpen]          = useState(false);
  const [column, setColumn]      = useState(currentSort);
  const [direction, setDir]      = useState<Direction>(currentDir);

  function toggleDesktop(col: string) {
    const dir     = col === currentSort ? (currentDir === 'asc' ? 'desc' : 'asc') : 'asc';
    const params  = new URLSearchParams(searchParams);

    params.set('sort', col);
    params.set('dir', dir);
    params.set('page', '1');

    router.push(`${pathname}?${params.toString()}`);
  }

  function applyMobile() {
    const params = new URLSearchParams(searchParams);
    params.set('sort', column);
    params.set('dir', direction);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <>
      <div className="hidden sm:flex flex-wrap gap-2">
        {columns.map((c) => {
          const active = currentSort === c.key;
          return (
            <button
              key={c.key}
              onClick={() => toggleDesktop(c.key)}
              className={`cursor-pointer select-none flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm
                ${
                  active
                    ? 'bg-blue-50 text-blue-700 border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-sm'
                }`}
            >
              {c.label}
              {active && (
                <span className="text-xs">
                  {currentDir === 'asc' ? '▼' : '▲'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setOpen(true)}
        className="sm:hidden inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        title="Filtros"
      >
        <FunnelIcon className="h-5 w-5" />
        Filtros
      </button>

      <Transition show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 sm:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-end">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-y-full"
              enterTo="translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="translate-y-0"
              leaveTo="translate-y-full"
            >
              <Dialog.Panel className="w-full rounded-t-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-semibold">
                    Ordenar
                  </Dialog.Title>
                  <button
                    title="Cerrar"
                    onClick={() => setOpen(false)}
                    className="rounded p-2 hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Columna
                </label>
                <select
                  title="Selecciona la columna para ordenar"
                  value={column}
                  onChange={(e) => setColumn(e.target.value)}
                  className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
                >
                  {columns.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
                
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Dirección
                </label>
                <div className="mb-6 flex gap-2">
                  {['asc', 'desc'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDir(d as Direction)}
                      className={`flex-1 rounded px-3 py-2 text-sm ${
                        direction === d
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 text-gray-700'
                      }`}
                    >
                      {d === 'asc' ? 'Ascendente' : 'Descendente'}
                    </button>
                  ))}
                </div>

                <button
                  onClick={applyMobile}
                  className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
                >
                  Aplicar
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
