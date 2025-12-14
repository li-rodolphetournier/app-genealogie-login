export type UploadState = 'IDLE' | 'HOVERING' | 'UPLOADING' | 'SUCCESS';

export type UploadEvent = 'MOUSEENTER' | 'MOUSELEAVE' | 'CLICK' | 'UPLOADED' | 'RESET';

export type UploaderMachine = {
  initial: UploadState;
  states: {
    [key in UploadState]: {
      on: Partial<Record<UploadEvent, UploadState>>;
    };
  };
};

export type FileUploaderProps = {
  onFileSelect: (files: File[]) => void;
  onUploadComplete?: (urls: string[]) => void;
  onError?: (error: string) => void;
  folder?: string;
  maxFileSizeMB?: number;
  multiple?: boolean;
  accept?: string;
};

