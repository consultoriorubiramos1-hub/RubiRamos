'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

const images = [
  { src: '/blackbear.png', name: 'Black Bear' },
  { src: '/suplint.png', name: 'Suplint' },
  { src: '/purepre.png', name: 'Pure Pre-Workout' },
  { src: '/proteinpowder.png', name: 'Protein Powder' },
];

export default function CarouselProducts() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="relative w-full mx-auto py-8 px-4"
      style={{ 
        backgroundColor: 'rgba(169, 216, 107, 0.25)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Título llamativo */}
      <div className="text-center mb-8">
        <h2 
          className="text-4xl font-bold drop-shadow-lg"
          style={{
            color: '#C96518',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            background: 'linear-gradient(135deg, #C96518, #E87C1E)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          PRODUCTOS PRINCIPALES
        </h2>
        <div 
          className="w-32 h-1 mx-auto mt-3 rounded-full"
          style={{ backgroundColor: '#F58634' }}
        ></div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Contenedor de imagen y nombre */}
        <div className="relative w-full h-80 flex items-center justify-center overflow-hidden rounded-2xl mb-6">
          <Image
            src={images[current].src}
            alt={images[current].name}
            width={320}
            height={320}
            className="object-contain drop-shadow-2xl transition-all duration-700 ease-in-out transform hover:scale-105"
          />
        </div>

        {/* Nombre del producto */}
        <p 
          className="text-center text-2xl font-bold mb-6 transition-all duration-500"
          style={{ 
            color: '#C96518',
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
          }}
        >
          {images[current].name}
        </p>

        {/* Indicadores */}
        <div className="flex justify-center gap-4">
          {images.map((_, idx) => (
            <div
              key={idx}
              className="w-4 h-4 rounded-full transition-all duration-300 cursor-pointer border-2 border-white shadow-lg"
              style={{
                backgroundColor: idx === current ? '#C96518' : 'rgba(201, 101, 24, 0.3)',
                transform: idx === current ? 'scale(1.3)' : 'scale(1)',
                borderColor: idx === current ? '#F58634' : 'transparent'
              }}
              onClick={() => setCurrent(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}