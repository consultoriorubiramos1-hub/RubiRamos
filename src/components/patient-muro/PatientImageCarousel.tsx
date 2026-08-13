'use client';

import { useState, useEffect } from 'react';

interface PatientImageCarouselProps {
  images: { id: number; url: string }[];
}

export default function PatientImageCarousel({ images }: PatientImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalOpen]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openModal = (url: string) => {
    setSelectedImage(url);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedImage('');
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (images.length === 0) return null;

  return (
    <>
      <div className="relative rounded-lg overflow-hidden bg-[#FAF9F7]">
        {images.length === 1 ? (
          <button
            onClick={() => openModal(images[0].url)}
            className="w-full cursor-pointer group"
          >
            <img
              src={images[0].url}
              alt="Imagen"
              className="w-full max-h-96 object-contain bg-[#FAF9F7] transition-transform group-hover:scale-105 duration-300"
            />
          </button>
        ) : (
          <div className="relative group">
            <div className="overflow-hidden">
              <button
                onClick={() => openModal(images[currentIndex].url)}
                className="w-full cursor-pointer"
              >
                <img
                  src={images[currentIndex].url}
                  alt={`Imagen ${currentIndex + 1}`}
                  className="w-full max-h-96 object-contain bg-[#FAF9F7] transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            </div>
            
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-all opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentIndex 
                          ? 'bg-white w-4' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal para ver imagen en grande */}
      {modalOpen && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={selectedImage}
              alt="Imagen ampliada"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/75 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = (currentIndex - 1 + images.length) % images.length;
                    setCurrentIndex(newIndex);
                    setSelectedImage(images[newIndex].url);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/75 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = (currentIndex + 1) % images.length;
                    setCurrentIndex(newIndex);
                    setSelectedImage(images[newIndex].url);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/75 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(idx);
                        setSelectedImage(images[idx].url);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentIndex 
                          ? 'bg-white w-6' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}