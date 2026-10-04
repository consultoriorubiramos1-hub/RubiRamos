import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

interface Breadcrumb {
  label: string;
  href: string;
  active?: boolean;
}

export default function AdminBreadcrumbs({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) {
  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex flex-wrap items-center gap-1 md:gap-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="inline-flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-5 w-5 text-gray-400 mx-2" />
            )}
            <Link
              href={breadcrumb.href}
              className={`text-sm font-medium ${breadcrumb.active ? 'text-[#2C3E34]' : 'text-[#6E7C72] hover:text-[#5A8C7A]'}`}
              aria-current={breadcrumb.active ? 'page' : undefined}
            >
              {breadcrumb.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
