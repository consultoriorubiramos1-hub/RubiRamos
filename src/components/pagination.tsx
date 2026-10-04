'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Link from 'next/link';
import { generatePagination } from '@/lib/utils';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawPage = Number(searchParams.get('page'));
  const currentPage = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const allPages = generatePagination(currentPage, totalPages);

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
      {/* Mobile view: flechas y páginas */}
      <div className="flex min-w-0 flex-1 justify-between sm:hidden">
        <PaginationArrow
          direction="left"
          href={createPageURL(currentPage - 1)}
          isDisabled={currentPage <= 1}
        />
        <p className="self-center text-sm text-[#6E7C72]" aria-live="polite">{currentPage} / {totalPages}</p>
        <PaginationArrow
          direction="right"
          href={createPageURL(currentPage + 1)}
          isDisabled={currentPage >= totalPages}
        />
      </div>

      {/* Desktop view */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Página <span className="font-medium">{currentPage}</span> de{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <PaginationArrow
              direction="left"
              href={createPageURL(currentPage - 1)}
              isDisabled={currentPage <= 1}
            />
            {allPages.map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={index}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    ...
                  </span>
                );
              }
              return (
                <PaginationNumber
                  key={index}
                  href={createPageURL(page)}
                  page={page as number}
                  isActive={currentPage === page}
                />
              );
            })}
            <PaginationArrow
              direction="right"
              href={createPageURL(currentPage + 1)}
              isDisabled={currentPage >= totalPages}
            />
          </nav>
        </div>
      </div>
    </div>
  );
}

function PaginationNumber({
  page,
  href,
  isActive,
}: {
  page: number;
  href: string;
  isActive: boolean;
}) {
  const className = clsx(
    'min-h-11 min-w-11 relative inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded',
    {
      'bg-[#5A8C7A] text-white': isActive,
      'text-gray-900 hover:bg-gray-100': !isActive,
    }
  );

  return isActive ? (
    <span aria-current="page" className={className}>
      {page}
    </span>
  ) : (
    <Link href={href} className={className}>
      {page}
    </Link>
  );
}

function PaginationArrow({
  href,
  direction,
  isDisabled,
}: {
  href: string;
  direction: 'left' | 'right';
  isDisabled?: boolean;
}) {
  const className = clsx(
    'min-h-11 min-w-11 relative inline-flex items-center justify-center rounded-xl px-2 py-2 text-[#5A8C7A] ring-1 ring-inset ring-gray-300 focus:z-20',
    {
      'cursor-not-allowed opacity-50': isDisabled,
      'hover:bg-gray-50': !isDisabled,
    }
  );

  const icon = direction === 'left' ? (
    <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
  ) : (
    <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
  );

  return isDisabled ? (
    <span className={className}>{icon}</span>
  ) : (
    <Link href={href} className={className}>
      {icon}
    </Link>
  );
}
