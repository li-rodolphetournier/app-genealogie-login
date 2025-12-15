import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GenericImageUploader from '../ImageUploader';

describe('GenericImageUploader', () => {
  const onUploadSuccess = vi.fn();
  const onError = vi.fn();
  const onUploadStart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ imageUrl: '/uploaded.png' }),
    } as any);
  });

  it('doit appeler onError si le fichier est trop volumineux', () => {
    const file = new File([new Uint8Array(6 * 1024 * 1024)], 'big.png', {
      type: 'image/png',
    });

    render(
      <GenericImageUploader
        onUploadSuccess={onUploadSuccess}
        onError={onError}
        onUploadStart={onUploadStart}
        maxFileSizeMB={1}
      >
        <button>Upload</button>
      </GenericImageUploader>,
    );

    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(hiddenInput, { target: { files: [file] } });

    expect(onError).toHaveBeenCalled();
    expect(onUploadSuccess).not.toHaveBeenCalled();
  });

  it('doit uploader une image valide et appeler onUploadSuccess', async () => {
    const file = new File(['data'], 'image.png', { type: 'image/png' });

    render(
      <GenericImageUploader
        onUploadSuccess={onUploadSuccess}
        onError={onError}
        onUploadStart={onUploadStart}
      >
        <button>Upload</button>
      </GenericImageUploader>,
    );

    const trigger = screen.getByRole('button', { name: /upload/i });
    fireEvent.click(trigger);

    const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(hiddenInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onUploadStart).toHaveBeenCalled();
      expect(onUploadSuccess).toHaveBeenCalledWith('/uploaded.png');
    });
  });
});


