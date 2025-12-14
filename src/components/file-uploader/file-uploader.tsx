'use client';

import { useEffect, useReducer, useRef } from 'react';
import { CloudIcon } from './cloud-icon';
import { Progress } from './progress';
import { uploaderReducer, uploaderMachine, events, states } from './uploader-machine';
import type { FileUploaderProps } from './types';

const TIMEOUT = 2000;

export function FileUploader({
  onFileSelect,
  onUploadComplete,
  onError,
  folder = 'objects',
  maxFileSizeMB = 2,
  multiple = true,
  accept = 'image/*',
}: FileUploaderProps) {
  const [state, dispatch] = useReducer(uploaderReducer, uploaderMachine.initial);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    switch (state) {
      case states.SUCCESS:
        const resetTimer = setTimeout(() => dispatch(events.RESET), TIMEOUT);
        return () => clearTimeout(resetTimer);
    }
  }, [state]);

  const handleClick = () => {
    if (state === states.SUCCESS) {
      dispatch(events.RESET);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validation de la taille
    for (const file of fileArray) {
      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > maxFileSizeMB) {
        onError?.(`Le fichier ${file.name} est trop volumineux. La taille maximale est de ${maxFileSizeMB} MB.`);
        return;
      }
    }

    dispatch(events.CLICK);
    onFileSelect(fileArray);

    // Si onUploadComplete est fourni, on fait l'upload automatiquement
    if (onUploadComplete) {
      try {
        const urls: string[] = [];
        for (const file of fileArray) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          uploadFormData.append('folder', folder);

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            const imageUrl = uploadData.imageUrl || uploadData.url || uploadData.publicUrl;
            if (imageUrl) {
              urls.push(imageUrl);
            }
          } else {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `Erreur lors de l'upload de ${file.name}`);
          }
        }
        dispatch(events.UPLOADED);
        onUploadComplete(urls);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
        onError?.(errorMessage);
        dispatch(events.RESET);
      }
    } else {
      // Si pas d'upload automatique, on passe directement en SUCCESS
      dispatch(events.UPLOADED);
    }
  };

  const showProgress = [states.UPLOADING, states.SUCCESS].includes(state);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        id="file-upload-input"
      />
      <div
        className="file-uploader"
        data-state={state}
        onMouseEnter={() => dispatch(events.MOUSEENTER)}
        onMouseLeave={() => dispatch(events.MOUSELEAVE)}
        onClick={handleClick}
      >
        <CloudIcon state={state} />

        <div className="message">
          <strong className="message-text">
            Téléverser
          </strong>
        </div>

        <CloudIcon state={state} showCheckOnly={true} />

        <div className="progress-container" data-hidden={!showProgress}>
          {showProgress && <Progress duration={TIMEOUT} />}
        </div>
      </div>
    </>
  );
}

