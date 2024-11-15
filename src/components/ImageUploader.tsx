import React, { useState } from 'react';
import Modal from './Modal';

const ImageUploader = () => {
  const [image, setImage] = useState<File | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const handleUpload = async () => {
    if (!image) {
      setAlertMessage('Veuillez sélectionner une image.');
      setModalOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append('file', image);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload de l\'image');
      }

      const data = await response.json();
      console.log('Image uploadée avec succès:', data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setAlertMessage('Erreur d\'upload: ' + errorMessage);
      setModalOpen(true);
    }
  };

  const handleConfirm = () => {
    setModalOpen(false);
    // Vous pouvez ajouter d'autres actions ici si nécessaire
  };

  const handleCancel = () => {
    setModalOpen(false);
  };

  return (
    <div>
      <h1>Uploader d'Images</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button onClick={handleUpload}>Uploader l'Image</button>
      <Modal 
        isOpen={isModalOpen} 
        message={alertMessage} 
        onConfirm={handleConfirm} 
        onCancel={handleCancel} 
      />
    </div>
  );
};

export default ImageUploader;
