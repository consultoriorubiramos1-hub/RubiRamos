import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export interface LegalSection {
  subtitle: string;
  paragraphs: string[];
  list?: string[]; 
}


interface LegalPageLayoutProps {
  title: string;
  introduction: string;
  sections: LegalSection[];
}

export default function LegalPageLayout({ title, introduction, sections }: LegalPageLayoutProps) {
  return (
    <section className="min-h-screen bg-[#FAF9F7] py-16 text-[#2C3E34] sm:py-20">
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-serif text-3xl font-bold text-[#2C3E34] sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#6E7C72]">
            {introduction}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E6E3DE] bg-white p-4 sm:p-6 shadow-sm sm:p-10">
          {sections.map((section) => (
            <section key={section.subtitle} className="border-b border-[#E6E3DE] py-7 first:pt-0 last:border-0 last:pb-0">
              <h2 className="mb-4 flex items-start gap-2 font-serif text-xl font-bold text-[#2C3E34] sm:text-2xl">
                <ChevronRightIcon className="mt-1 h-5 w-5 shrink-0 text-[#BD7D4A]" aria-hidden="true" />
                {section.subtitle}
              </h2>
              <div className="space-y-4 break-words leading-relaxed text-[#6E7C72]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.list && (
                  <ul className="list-disc space-y-2 pl-6 marker:text-[#5A8C7A]">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
