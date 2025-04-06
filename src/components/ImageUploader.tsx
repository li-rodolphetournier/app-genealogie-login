import React, { useRef, useState } from 'react';

// Interface pour les props du composant générique
interface ImageUploaderProps {
  onUploadSuccess: (imageUrl: string) => void; // Callback en cas de succès, renvoie une seule URL
  onError?: (errorMessage: string) => void; // Callback en cas d'erreur
  onUploadStart?: () => void; // Callback au début de l'upload
  uploadUrl?: string; // URL de l'API pour l'upload (optionnel, défaut: /api/upload)
  acceptedFileTypes?: string; // Types de fichiers acceptés (optionnel, défaut: image/*)
  children: React.ReactElement; // L'élément qui déclenchera l'ouverture du sélecteur de fichier
  maxFileSizeMB?: number; // Taille maximale en MB (optionnel)
}

const GenericImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadSuccess,
  onError,
  onUploadStart,
  uploadUrl = '/api/upload', // Valeur par défaut pour l'URL
  acceptedFileTypes = 'image/*', // Valeur par défaut pour les types de fichiers
  children,
  maxFileSizeMB = 5, // Taille max par défaut (ex: 5MB)
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Déclenche le clic sur l'input file caché
  const handleTriggerClick = () => {
    fileInputRef.current?.click();
  };

  // Gère la sélection du fichier et lance l'upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    // Réinitialise l'input pour permettre de sélectionner le même fichier à nouveau
    if (event.target) {
      event.target.value = '';
    }

    if (!file) {
      return; // Pas de fichier sélectionné
    }

    // Validation du type de fichier
    if (!file.type.startsWith('image/') && acceptedFileTypes === 'image/*') {
      onError?.("Le fichier sélectionné n'est pas une image valide.");
      return;
    }
    // Ajoutez ici d'autres validations de type si acceptedFileTypes est plus spécifique

    // Validation de la taille du fichier
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxFileSizeMB) {
      onError?.(`Le fichier est trop volumineux. La taille maximale est de ${maxFileSizeMB} MB.`);
      return;
    }

    // Début de l'upload
    setIsUploading(true);
    onUploadStart?.();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Erreur lors de l'upload de l'image.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          // Ignorer l'erreur si la réponse n'est pas du JSON
          errorMessage = `Erreur serveur (${response.status}) lors de l'upload.`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Assumant que l'API renvoie un objet avec une clé `imageUrl` ou `imageUrls`
      const imageUrl = data.imageUrl || (Array.isArray(data.imageUrls) ? data.imageUrls[0] : null);

      if (!imageUrl) {
        throw new Error("L'URL de l'image n'a pas été retournée par l'API.");
      }

      onUploadSuccess(imageUrl); // Succès

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors de l'upload.";
      onError?.(errorMessage); // Gérer l'erreur
    } finally {
      setIsUploading(false); // Fin de l'upload (succès ou erreur)
    }
  };

  // Clone l'élément enfant pour y attacher le gestionnaire de clic
  const triggerElement = React.cloneElement(children, {
    onClick: handleTriggerClick,
    disabled: isUploading || children.props.disabled, // Désactiver pendant l'upload
  });

  return (
    <>
      {/* Input file caché */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedFileTypes}
        style={{ display: 'none' }} // Cache l'input
        disabled={isUploading}
      />
      {/* L'élément déclencheur (ex: bouton) fourni par le parent */}
      {triggerElement}
      {/* Optionnel: Afficher un indicateur de chargement global ici si nécessaire */}
      {/* {isUploading && <span>Upload en cours...</span>} */}
    </>
  );
};

export default GenericImageUploader;