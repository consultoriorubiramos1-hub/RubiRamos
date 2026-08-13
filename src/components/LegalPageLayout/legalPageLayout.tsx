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

export default function legalPageLayout({ title, introduction, sections }: LegalPageLayoutProps) {
  return (
    <section className="min-h-screen bg-gray-50 text-gray-900 py-20">
      <div className="container mx-auto px-4 max-w-4xl">

        <div className="text-center mb-12">
          <h1 className="text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-teal-600 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-xl text-gray-600">
            {introduction}
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-lg">
          {sections.map((section, index) => (
            <div key={index} className="mb-8 last:mb-0">
              <h2 className="text-3xl font-bold text-cyan-700 mb-4 flex items-center">
                <ChevronRightIcon className="h-6 w-6 text-cyan-500 mr-2" />
                {section.subtitle}
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                {section.paragraphs.map((paragraph, pIndex) => (
                  <p key={pIndex}>{paragraph}</p>
                ))}
                {section.list && ( 
                  <ul className="list-disc pl-8 space-y-2">
                    {section.list.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}