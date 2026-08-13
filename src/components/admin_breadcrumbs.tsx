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
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="inline-flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-5 w-5 text-gray-400 mx-2" />
            )}
            <Link
              href={breadcrumb.href}
              className={`text-sm font-medium ${breadcrumb.active ? 'text-[#1e343b]' : 'text-gray-500 hover:text-[#66b0ca]'}`}
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