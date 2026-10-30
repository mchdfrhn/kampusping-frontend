'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormProvider } from '@/components/form/FormProvider';
import { RHFTextField } from '@/components/form/RHFTextField';
import { PageHeader } from '@/components/layout/PageHeader';
import { authService } from '@/core/auth/auth.service';
import { useAuthStore } from '@/core/auth/auth.store';
import { routes } from '@/core/config/route.config';
import { getErrorMessage } from '@/core/http/api-error';
import { handleFormApiError } from '@/core/http/form-errors';
import { useNotify } from '@/core/notify/NotifyProvider';
import { formatDisplayDateTime } from '@/core/utils/date.util';
import { passwordSchema } from '@/core/validation/password';

const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required').max(150, 'At most 150 characters'),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordFormSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password'),
    new_password: passwordSchema,
    confirm_password: z.string(),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  });
type PasswordValues = z.infer<typeof passwordFormSchema>;

const ProfileCard = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const notify = useNotify();

  const methods = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user?.full_name ?? '' },
  });
  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = methods;

  useEffect(() => {
    if (user) reset({ full_name: user.full_name });
  }, [user, reset]);

  if (!user) return null;

  const onSubmit = handleSubmit(async (values) => {
    try {
      setUser(await authService.updateProfile(values));
      notify.success('Profile updated.');
    } catch (error) {
      notify.error(getErrorMessage(error, 'Could not update your profile.'));
    }
  });

  return (
    <Card>
      <CardHeader title="Profile" subheader="Your name is shown across the app." />
      <CardContent>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Stack spacing={2.5} sx={{ maxWidth: 480 }}>
            <RHFTextField<ProfileValues> name="full_name" label="Full name" fullWidth />
            <RHFTextField
              label="Email"
              value={user.email}
              disabled
              fullWidth
              helperText="Contact an administrator to change your email."
              name="email"
            />
            <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography color="text.secondary" variant="body2">
                Roles
              </Typography>
              {user.roles.length === 0 ? (
                <Typography variant="body2">None</Typography>
              ) : (
                user.roles.map((role) => (
                  <Chip key={role.id} label={role.name} size="small" variant="outlined" />
                ))
              )}
            </Stack>
            <Typography color="text.secondary" variant="caption">
              Last sign-in: {formatDisplayDateTime(user.last_login_at, 'First session')}
            </Typography>
            <div>
              <Button
                disabled={!isDirty || isSubmitting}
                startIcon={
                  isSubmitting ? <CircularProgress color="inherit" size={16} /> : undefined
                }
                type="submit"
                variant="contained"
              >
                Save changes
              </Button>
            </div>
          </Stack>
        </FormProvider>
      </CardContent>
    </Card>
  );
};

const PasswordCard = () => {
  const clear = useAuthStore((state) => state.clear);
  const notify = useNotify();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const methods = useForm<PasswordValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });
  const {
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await authService.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      // The server revoked every session (including this one), so sign in again.
      clear();
      notify.success('Password changed. Please sign in again.');
      router.replace(routes.login);
    } catch (error) {
      handleFormApiError(error, setError, ['current_password', 'new_password'], {});
      setFormError(getErrorMessage(error, 'Could not change your password.'));
    }
  });

  return (
    <Card>
      <CardHeader
        title="Change password"
        subheader="You will be signed out everywhere after changing it."
      />
      <CardContent>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Stack spacing={2.5} sx={{ maxWidth: 480 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <RHFTextField<PasswordValues>
              name="current_password"
              label="Current password"
              type="password"
              autoComplete="current-password"
              fullWidth
            />
            <RHFTextField<PasswordValues>
              name="new_password"
              label="New password"
              type="password"
              autoComplete="new-password"
              helperText="At least 10 characters, with a letter and a digit."
              fullWidth
            />
            <RHFTextField<PasswordValues>
              name="confirm_password"
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              fullWidth
            />
            <div>
              <Button
                disabled={isSubmitting}
                startIcon={
                  isSubmitting ? <CircularProgress color="inherit" size={16} /> : undefined
                }
                type="submit"
                variant="contained"
              >
                Change password
              </Button>
            </div>
          </Stack>
        </FormProvider>
      </CardContent>
    </Card>
  );
};

export const ProfilePage = () => (
  <>
    <PageHeader
      title="Profile"
      description="Manage your account details and password."
      breadcrumbs={[{ label: 'Dashboard', href: routes.dashboard }, { label: 'Profile' }]}
    />
    <Stack spacing={3}>
      <ProfileCard />
      <PasswordCard />
    </Stack>
  </>
);
