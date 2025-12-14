'use client';

import type { UploadState } from './types';
import { states } from './uploader-machine';

type CloudIconProps = {
  state: UploadState;
  showCheckOnly?: boolean;
};

const svgDisplayProps = {
  viewBox: '0 0 32 32',
  width: '100',
  strokeLinecap: 'round' as const,
  strokejoin: 'round' as const,
  strokeMiterlimit: '2',
  fill: 'none',
  stroke: '#000',
  strokeWidth: '2',
};

export function CloudIcon({ state, showCheckOnly = false }: CloudIconProps) {
  const showArrow = [states.UPLOADING, states.SUCCESS, states.HOVERING].includes(state);
  
  if (showCheckOnly) {
    return (
      <div className="check-icon">
        <svg
          className="check"
          data-hidden={![states.SUCCESS].includes(state)}
          {...svgDisplayProps}
        >
          <path d="M11.4 15.787l3.426 2.553 5.774-5.556" />
        </svg>
      </div>
    );
  }
  
  return (
    <div className="cloud-icon">
      <svg className="cloud" data-hidden="false" {...svgDisplayProps}>
        <path d="M18 22h6.001A5.003 5.003 0 0029 17a4.997 4.997 0 00-3.117-4.634 5.503 5.503 0 00-7.789-3.813 7 7 0 00-13.082 3.859A5.007 5.007 0 002 17c0 2.761 2.232 5 4.999 5H13" />
      </svg>
      <svg
        className="arrow"
        data-hidden={!showArrow}
        {...svgDisplayProps}
      >
        <path d="M15.5 15.151v11.824-11.824z" />
        <path d="M12.075 18.34l3.425-3.528 3.425 3.528" />
      </svg>
    </div>
  );
}

