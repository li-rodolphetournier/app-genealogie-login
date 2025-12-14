import type { UploadState, UploadEvent, UploaderMachine } from './types';

export const states = {
  IDLE: 'IDLE' as UploadState,
  HOVERING: 'HOVERING' as UploadState,
  UPLOADING: 'UPLOADING' as UploadState,
  SUCCESS: 'SUCCESS' as UploadState,
};

export const events = {
  MOUSEENTER: 'MOUSEENTER' as UploadEvent,
  MOUSELEAVE: 'MOUSELEAVE' as UploadEvent,
  CLICK: 'CLICK' as UploadEvent,
  UPLOADED: 'UPLOADED' as UploadEvent,
  RESET: 'RESET' as UploadEvent,
};

export const uploaderMachine: UploaderMachine = {
  initial: states.IDLE,
  states: {
    [states.IDLE]: {
      on: {
        [events.CLICK]: states.UPLOADING,
        [events.MOUSEENTER]: states.HOVERING,
      },
    },
    [states.HOVERING]: {
      on: {
        [events.CLICK]: states.UPLOADING,
        [events.MOUSELEAVE]: states.IDLE,
      },
    },
    [states.UPLOADING]: {
      on: {
        [events.UPLOADED]: states.SUCCESS,
      },
    },
    [states.SUCCESS]: {
      on: {
        [events.CLICK]: states.IDLE,
        [events.RESET]: states.IDLE,
      },
    },
  } as UploaderMachine['states'],
};

export function uploaderReducer(
  state: UploadState,
  event: UploadEvent
): UploadState {
  return (
    (uploaderMachine.states[state]?.on[event] as UploadState) || state
  );
}

