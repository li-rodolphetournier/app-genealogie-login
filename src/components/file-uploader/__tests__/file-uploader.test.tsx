import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploader } from '../file-uploader';

const fetchMock = vi.fn();

describe('FileUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error override
    global.fetch = fetchMock;
  });

  it('appelle onError si un fichier dépasse la taille maximale', () => {
    const onError = vi.fn();
    render(
      <FileUploader
        onFileSelect={vi.fn()}
        onUploadComplete={vi.fn()}
        onError={onError}
        maxFileSizeMB={1}
      />,
    );

    const input = document.getElementById('file-upload-input') as HTMLInputElement;

    const file = new File(['x'.repeat(2 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onError).toHaveBeenCalled();
  });

  it('upload les fichiers et appelle onUploadComplete', async () => {
    const onUploadComplete = vi.fn();
    render(
      <FileUploader
        onFileSelect={vi.fn()}
        onUploadComplete={onUploadComplete}
        onError={vi.fn()}
      />,
    );

    const input = document.getElementById('file-upload-input') as HTMLInputElement;
    const file = new File(['abc'], 'photo.png', { type: 'image/png' });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ imageUrl: '/img/photo.png' }),
    });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalledWith(['/img/photo.png']);
    });
  });
});


