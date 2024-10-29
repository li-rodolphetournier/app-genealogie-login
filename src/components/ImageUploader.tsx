import React, { ChangeEvent } from 'react';

interface ImageUploaderProps {
  onUpload: (imageUrls: string[]) => void;
  type: 'genealogie' | 'user' | 'object';
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

            console.log('Uploading file:', file.name);
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('Upload error:', errorText);
              throw new Error(`Upload failed: ${errorText}`);
            }

            const data = await response.json();
            console.log('Upload success:', data);
            return data.url;
          })
        );

        const validUrls = uploadedUrls.filter((url): url is string => url !== null);
        if (validUrls.length > 0) {
          onUpload(validUrls);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Erreur lors de l\'upload de l\'image. Veuillez réessayer.');
      }
    }
  };

  return (
    <input
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      className="border rounded p-2"
    />
  );
};

export default ImageUploader;
