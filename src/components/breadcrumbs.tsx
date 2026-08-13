'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { breadcrumbLabels } from '@/lib/breadcrumbs';

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="w-full bg-white border-y border-[#E6E3DE] px-6 py-2.5 text-sm shadow-xs">
      <div className="max-w-7xl mx-auto">
        <ol className="flex items-center space-x-2">
          <li>
            <Link
              href="/"
              className="text-[#6B8E7B] hover:text-[#BD7D4A] font-medium flex items-center gap-1 group"
            >
              <span className="group-hover:underline">Inicio</span>
            </Link>
          </li>

          {segments.map((segment, index) => {
            const href = '/' + segments.slice(0, index + 1).join('/');
            const isLast = index === segments.length - 1;

            const label =
              breadcrumbLabels[segment] ??
              decodeURIComponent(segment)
                .replace(/-/g, ' ')
                .replace(/\b\w/g, char => char.toUpperCase());

            return (
              <li key={href} className="flex items-center space-x-2">
                <ChevronRight className="w-3.5 h-3.5 text-[#6E7C72]" />
                {isLast ? (
                  <span className="text-[#2C3E34] font-semibold">
                    {label}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="text-[#6E7C72] hover:text-[#BD7D4A] transition-colors group"
                  >
                    <span className="group-hover:underline">{label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}