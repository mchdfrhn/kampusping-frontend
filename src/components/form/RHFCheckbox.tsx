'use client';

import { Controller, type FieldValues, type Path, useFormContext } from 'react-hook-form';

import { AppCheckbox, type AppCheckboxProps } from '@/components/base/AppCheckbox';

export type RHFCheckboxProps<T extends FieldValues> = Omit<AppCheckboxProps, 'name'> & {
  name: Path<T>;
};

export const RHFCheckbox = <T extends FieldValues>({ name, ...props }: RHFCheckboxProps<T>) => {
  const { control } = useFormContext<T>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <AppCheckbox
          {...props}
          checked={Boolean(field.value)}
          onChange={(_, checked) => field.onChange(checked)}
        />
      )}
    />
  );
};
