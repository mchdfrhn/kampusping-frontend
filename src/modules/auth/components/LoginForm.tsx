'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormProvider } from '@/components/form/FormProvider';
import { RHFTextField } from '@/components/form/RHFTextField';
import { useAuthStore } from '@/core/auth/auth.store';
import { getErrorMessage } from '@/core/http/api-error';
import { firstAccessibleRoute, safeNextPath } from '@/core/utils/navigation.util';

const schema = z.object({
  email: z.email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

type FormValues = z.infer<typeof schema>;

export const LoginForm = () => {
  const login = useAuthStore((state) => state.login);
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
      router.replace(
        safeNextPath(params.get('next'), firstAccessibleRoute(useAuthStore.getState().user)),
      );
    } catch (error) {
      setFormError(getErrorMessage(error, 'Tidak dapat masuk. Silakan coba lagi.'));
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Stack spacing={2.5}>
        {formError ? (
          <Alert severity="error" role="alert">
            {formError}
          </Alert>
        ) : null}
        <RHFTextField<FormValues>
          name="email"
          label="Email"
          type="email"
          autoComplete="username"
          autoFocus
          fullWidth
        />
        <RHFTextField<FormValues>
          name="password"
          label="Kata sandi"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          fullWidth
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    edge="end"
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          disabled={isSubmitting}
          size="large"
          startIcon={isSubmitting ? <CircularProgress color="inherit" size={18} /> : undefined}
          type="submit"
          variant="contained"
        >
          Masuk
        </Button>
      </Stack>
    </FormProvider>
  );
};
