"use client";

import { FaSearch } from "react-icons/fa";
import { useRouter } from 'next/navigation';

interface EmptyStateProps {
  search: string;
  categoria: string;
}

export default function EmptyState({ search, categoria }: EmptyStateProps) {
  const router = useRouter();

  const handleClearFilters = () => {
    router.push('/catalog');
  };

  return (
    <div className="text-center py-16 px-4 rounded-2xl" style={{ backgroundColor: '#FAF9F7' }}>
      <div className="max-w-md mx-auto">
        <div className="h-20 w-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#E6E3DE' }}
        >
          <FaSearch className="h-10 w-10" style={{ color: '#6E7C72' }} />
        </div>
        
        <h3 className="text-2xl font-bold font-serif mb-4" style={{ color: '#2C3E34' }}>
          No se encontraron productos
        </h3>
        
        <p className="text-lg mb-6" style={{ color: '#6E7C72' }}>
          {search ? (
            <>No hay resultados para "<span className="font-semibold" style={{ color: '#6B8E7B' }}>{search}</span>"</>
          ) : categoria !== 'Todos' ? (
            <>No hay productos disponibles en la categoría "<span className="font-semibold" style={{ color: '#6B8E7B' }}>{categoria}</span>"</>
          ) : (
            <>No hay productos disponibles en este momento</>
          )}
        </p>
        
        <div className="space-y-4">
          <p className="text-sm" style={{ color: '#6E7C72' }}>
            Puedes intentar:
          </p>
          <div className="flex flex-col gap-3">
            {categoria !== 'Todos' && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ 
                  backgroundColor: '#6B8E7B',
                  color: '#FFFFFF'
                }}
              >
                Ver todos los productos
              </button>
            )}
            <button
              onClick={() => router.push('/schedule')}
              className="px-4 py-2 rounded-lg font-medium border transition-colors"
              style={{ 
                borderColor: '#6B8E7B',
                color: '#6B8E7B',
                backgroundColor: 'transparent'
              }}
            >
              Consultar disponibilidad con la nutrióloga
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}