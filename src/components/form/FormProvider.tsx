'use client';

import type { FormEventHandler, ReactNode } from 'react';
import { FormProvider as RHFProvider, type FieldValues, type UseFormReturn } from 'react-hook-form';

export type FormProviderProps<T extends FieldValues> = {
  methods: UseFormReturn<T>;
  children: ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
};

/** React Hook Form context plus a <form>. Validation is left to Zod, not the browser. */
export const FormProvider = <T extends FieldValues>({
  methods,
  children,
  onSubmit,
}: FormProviderProps<T>) => (
  <RHFProvider {...methods}>
    <form noValidate onSubmit={onSubmit}>
      {children}
    </form>
  </RHFProvider>
);
