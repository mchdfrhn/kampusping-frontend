'use client';

import { Controller, type FieldValues, type Path, useFormContext } from 'react-hook-form';

import { AppTextField, type AppTextFieldProps } from '@/components/base/AppTextField';

export type RHFTextFieldProps<T extends FieldValues> = Omit<AppTextFieldProps, 'name'> & { name: Path<T> };

export const RHFTextField = <T extends FieldValues>({ name, ...props }: RHFTextFieldProps<T>) => {
  const { control } = useFormContext<T>();
  return <Controller name={name} control={control} render={({ field, fieldState }) => <AppTextField {...field} {...props} error={Boolean(fieldState.error)} helperText={fieldState.error?.message ?? props.helperText} />} />;
};
