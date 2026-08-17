'use client';

import type { ReactNode } from 'react';
import { FormProvider as RHFProvider, type FieldValues, type UseFormReturn } from 'react-hook-form';

export type FormProviderProps<T extends FieldValues> = { methods: UseFormReturn<T>; children: ReactNode; onSubmit?: () => void };

export const FormProvider = <T extends FieldValues>({ methods, children, onSubmit }: FormProviderProps<T>) => (
  <RHFProvider {...methods}><form onSubmit={onSubmit}>{children}</form></RHFProvider>
);
