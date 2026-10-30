'use client';

import { Controller, type FieldValues, type Path, useFormContext } from 'react-hook-form';

import { AppSelect, type AppSelectProps } from '@/components/base/AppSelect';

export type RHFSelectProps<T extends FieldValues> = Omit<AppSelectProps, 'name'> & {
  name: Path<T>;
};

export const RHFSelect = <T extends FieldValues>({ name, ...props }: RHFSelectProps<T>) => {
  const { control } = useFormContext<T>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => <AppSelect {...props} {...field} />}
    />
  );
};
