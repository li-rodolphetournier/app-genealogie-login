import React, { useEffect, useCallback, useState } from 'react';
import { logger } from '@/lib/utils/logger';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ImageResizerProps {
  file: File;
  onResize: (resizedFile: File) => void;
  onError: (error: string) => void;
}

export const ImageResizer: React.FC<ImageResizerProps> = React.memo(({ file, onResize, onError }) => {
  const [isResizing, setIsResizing] = useState(false);

  const resizeImage = useCallback(async (file: File): Promise<File> => {
    logger.debug(`Début du redimensionnement de l'image: ${file.name}`, `Taille originale: ${file.size} bytes`);

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          let quality = 0.7;

          if (width > 1920 || height > 1080) {
            const ratio = Math.min(1920 / width, 1080 / height);
            width *= ratio;
            height *= ratio;
            logger.debug(`Redimensionnement: ${img.width}x${img.height} -> ${width}x${height}`);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const reduceQuality = () => {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  if (blob.size > MAX_FILE_SIZE && quality > 0.1) {
                    quality -= 0.1;
                    reduceQuality();
                  } else {
                    const newFile = new File([blob], file.name, {
                      type: file.type,
                      lastModified: Date.now(),
                    });
                    logger.debug(`Redimensionnement terminé: ${file.size} bytes -> ${newFile.size} bytes`);
                    resolve(newFile);
                  }
                }
              },
              file.type,
              quality
            );
          };

          reduceQuality();
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  useEffect(() => {
    if (isResizing) return;

    const processImage = async () => {
      setIsResizing(true);
      try {
        const resizedFile = await resizeImage(file);
        onResize(resizedFile);
      } catch (error) {
        logger.error('Erreur lors du redimensionnement de l\'image:', error);
        onError('Une erreur s\'est produite lors du traitement de l\'image. Veuillez réessayer.');
      } finally {
        setIsResizing(false);
      }
    };

    processImage();
  }, [file, onResize, onError, resizeImage, isResizing]);

  return null;
});

ImageResizer.displayName = 'ImageResizer';
