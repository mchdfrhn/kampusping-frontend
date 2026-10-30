'use client';

import { Controller, type FieldValues, type Path, useFormContext } from 'react-hook-form';

import { AppDatePicker, type AppDatePickerProps } from '@/components/base/AppDatePicker';

export type RHFDatePickerProps<T extends FieldValues> = Omit<AppDatePickerProps, 'name'> & {
  name: Path<T>;
};

export const RHFDatePicker = <T extends FieldValues>({ name, ...props }: RHFDatePickerProps<T>) => {
  const { control } = useFormContext<T>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <AppDatePicker {...props} value={field.value} onChange={field.onChange} />
      )}
    />
  );
};
