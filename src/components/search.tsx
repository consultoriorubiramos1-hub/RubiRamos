'use client';

import { useDebouncedCallback } from 'use-debounce';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative flex-1 max-w-md">
      <label htmlFor="search" className="sr-only">
        Buscar
      </label>
      <input
        id="search"
        type="search"
        className="peer w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-[#1e343b] placeholder:text-gray-400 focus:border-[#66b0ca] focus:outline-none focus:ring-2 focus:ring-[#a8d8ea]/50 transition-all"
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('query')?.toString()}
      />
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
    </div>
  );
}