'use client';

import Image from 'next/image';
import { Producto } from '@/lib/definitions';

interface ProductCardProps {
  producto: Producto;
}

export default function ProductCard({ producto }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(price);
  };

  const cloudinaryUrl = producto.image_url || 'https://res.cloudinary.com/demo/image/upload/v1/sample';

  return (
    <div className="bg-white rounded-lg border border-[#E6E3DE] overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-[#FAF9F7]">
        <Image
          src={cloudinaryUrl}
          alt={producto.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain p-4"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://res.cloudinary.com/demo/image/upload/v1/sample';
          }}
        />
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-[#2C3E34] text-base mb-1 line-clamp-2">
          {producto.name}
        </h3>
        
        <p className="text-sm text-[#6E7C72] mb-3 line-clamp-2">
          {producto.description}
        </p>
        
        <div className="flex items-center justify-between pt-2 border-t border-[#E6E3DE]">
          <span className="text-lg font-bold text-[#BD7D4A]">
            {formatPrice(producto.price)}
          </span>
          
          <span className={`text-xs px-2 py-1 rounded-full ${
            producto.stock > 10 
              ? 'bg-[#A8CF45]/20 text-[#2C3E34]'
              : producto.stock > 0
              ? 'bg-[#BD7D4A]/20 text-[#2C3E34]'
              : 'bg-[#F58634]/20 text-[#2C3E34]'
          }`}>
            {producto.stock > 0 ? `${producto.stock} disponibles` : 'Agotado'}
          </span>
        </div>
      </div>
    </div>
  );
}