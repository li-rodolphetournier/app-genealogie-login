import React, { ChangeEvent } from 'react';

interface ImageUploaderProps {
  onUpload: (imageUrls: string[]) => void;
  type: 'user' | 'object';
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, type }) => {
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      try {
        const uploadedUrls = await Promise.all(
          Array.from(files).map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);

            console.log(`Début de l'upload pour le fichier ${type}:`, file.name);
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`Upload failed with status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Image uploaded successfully:', data);
            return data.url;
          })
        );

        const validUrls = uploadedUrls.filter((url): url is string => url !== null);
        if (validUrls.length > 0) {
          onUpload(validUrls);
        }
      } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        alert(`Erreur lors de l'upload: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="border rounded p-2"
        multiple
      />
    </div>
  );
};

export default ImageUploader;
