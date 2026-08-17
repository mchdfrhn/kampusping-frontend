'use client';

import { useCallback, useRef, useState } from 'react';

import { invokeAsyncAction, type AsyncHandler } from '@/core/utils/async-action.util';

export const useAsyncAction = <T extends unknown[]>(handler: AsyncHandler<T>) => {
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef(false);

  const run = useCallback(
    async (...args: T) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setLoading(true);
      try {
        await invokeAsyncAction(handler, args);
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [handler],
  );

  return { loading, run };
};
