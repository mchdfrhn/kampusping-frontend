'use client';

import { useCallback, useState } from 'react';

export const useBoolean = (defaultValue = false) => {
  const [value, setValue] = useState(defaultValue);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((current) => !current), []);

  return { value, setValue, setTrue, setFalse, toggle };
};
