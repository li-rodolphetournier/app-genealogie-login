'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import ImageWithFallback from '@/components/ImageWithFallback';

type MessageImageCarouselProps = {
  images: string[];
  messageTitle?: string;
};

export function MessageImageCarousel({ images, messageTitle = 'message' }: MessageImageCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!images || images.length === 0) {
    return null;
  }

  // Si une seule image, l'afficher sans carousel
  if (images.length === 1) {
    return (
      <div className="relative aspect-video max-h-[500px] rounded-lg overflow-hidden mb-4">
        <ImageWithFallback
          src={images[0]}
          alt={`Image du message ${messageTitle}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          className="rounded"
          imgClassName="object-cover rounded"
        />
      </div>
    );
  }

  return (
    <div className="w-full mb-4">
      {/* Carousel principal */}
      <div className="overflow-hidden rounded-lg shadow-md mb-4" ref={emblaRef}>
        <div className="flex">
          {images.map((image, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 relative aspect-video max-h-[500px]">
              <ImageWithFallback
                src={image}
                alt={`Image ${index + 1} du message ${messageTitle}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                className="rounded"
                imgClassName="object-cover rounded"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
          aria-label="Image précédente"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Indicateurs de pagination */}
        <div className="flex gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === selectedIndex
                  ? 'bg-blue-600 w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Aller à l'image ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => emblaApi?.scrollNext()}
          className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
          aria-label="Image suivante"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Miniatures (thumbnails) */}
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`relative aspect-video rounded overflow-hidden border-2 transition-all ${
              index === selectedIndex
                ? 'border-blue-600 ring-2 ring-blue-200'
                : 'border-transparent hover:border-gray-300'
            }`}
            aria-label={`Voir l'image ${index + 1}`}
          >
            <ImageWithFallback
              src={image}
              alt={`Miniature ${index + 1}`}
              fill
              sizes="(max-width: 768px) 25vw, 8vw"
              className="rounded"
              imgClassName="object-cover rounded"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

