'use client';

import { useEffect, useRef, useState } from 'react';

type ProgressProps = {
  duration: number;
};

export function Progress({ duration }: ProgressProps) {
  const valueRef = useRef(0);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      valueRef.current = valueRef.current + 1;
      setValue(valueRef.current);
    }, duration / 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [duration]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <progress 
      {...({ min: 0, max: 100, value } as any)} 
      className="progress" 
    />
  );
}

