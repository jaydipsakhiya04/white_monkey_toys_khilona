'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, MoreHorizontal, ShieldCheck, UserCheck, UserPlus, UserX, Users } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, Dialog } from '@/components/ui/dialog';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { Card, CardHeader, EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { useAuth } from '@/features/auth/auth-provider';
import { getErrorMessage } from '@/lib/api-client';
import { applyApiFieldErrors } from '@/lib/form-errors';
import { qk } from '@/lib/query-keys';
import { adminService } from '@/services';
import type { AdminProfile, AdminRole, AdminUpdateInput } from '@/types/api';
import { formatPhone, formatRelative } from '@/utils/format';
import { passwordSchema, PasswordRules } from './password';

const ROLE_LABEL: Record<AdminRole, string> = { SUPER_ADMIN: 'Super admin', ADMIN: 'Admin' };

const createSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80, 'Too long'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\+?[\d\s-]{10,16}$/.test(v), 'Enter a valid phone number'),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']),
  password: passwordSchema,
});
type CreateValues = z.infer<typeof createSchema>;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function AdminUsers() {
  const qc = useQueryClient();
  const { admin: me } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: qk.admins, queryFn: adminService.list });
  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState<AdminProfile | null>(null);
  const [toggling, setToggling] = useState<AdminProfile | null>(null);

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: AdminUpdateInput }) => adminService.update(id, body),
    onSuccess: (updated) => {
      qc.setQueryData<AdminProfile[]>(qk.admins, (old) => old?.map((a) => (a.id === updated.id ? updated : a)));
    },
  });

  const changeRole = (a: AdminProfile, role: AdminRole) =>
    update.mutate(
      { id: a.id, body: { role } },
      {
        onSuccess: () => toast.success(`${a.name} is now ${ROLE_LABEL[role].toLowerCase()}`),
        onError: (err) => toast.error(getErrorMessage(err, 'Could not change the role')),
      },
    );

  return (
    <Card id="admins" className="scroll-mt-20">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Users className="size-4 text-muted" aria-hidden />
            Admin users
          </span>
        }
        description="People who can sign in to this dashboard. Only super admins can manage them."
        action={
          <Button size="sm" onClick={() => setAdding(true)}>
            <UserPlus /> Add admin
          </Button>
        }
      />
      {isLoading ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError || !data ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      ) : data.length === 0 ? (
        <EmptyState icon={Users} title="No admins yet" />
      ) : (
        <ul className="divide-y divide-line">
          {data.map((a) => {
            const isMe = a.id === me?.id;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-ink-soft">
                  {initials(a.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
                    <span className="truncate">{a.name}</span>
                    {isMe && <Badge tone="info">You</Badge>}
                    {!a.isActive && <Badge tone="danger">Deactivated</Badge>}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {a.email}
                    {a.phone ? ` · ${formatPhone(a.phone)}` : ''}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {a.lastLoginAt ? `Last sign-in ${formatRelative(a.lastLoginAt)}` : 'Never signed in'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    aria-label={`Role for ${a.name}`}
                    value={a.role}
                    disabled={isMe || update.isPending}
                    title={isMe ? "You can't change your own role" : undefined}
                    onChange={(e) => changeRole(a, e.target.value as AdminRole)}
                    wrapperClassName="w-36"
                    className="h-8 text-[13px]"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super admin</option>
                  </Select>
                  <DropdownMenu
                    label={`Actions for ${a.name}`}
                    trigger={<MoreHorizontal />}
                    items={[
                      { label: 'Reset password', icon: <KeyRound />, onSelect: () => setResetting(a) },
                      a.isActive
                        ? {
                            label: 'Deactivate',
                            icon: <UserX />,
                            danger: true,
                            disabled: isMe,
                            description: isMe ? "You can't deactivate yourself" : undefined,
                            onSelect: () => setToggling(a),
                          }
                        : { label: 'Activate', icon: <UserCheck />, onSelect: () => setToggling(a) },
                    ]}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AddAdminDialog open={adding} onClose={() => setAdding(false)} />
      <ResetPasswordDialog admin={resetting} onClose={() => setResetting(null)} />
      <ConfirmDialog
        open={!!toggling}
        onClose={() => setToggling(null)}
        loading={update.isPending}
        tone={toggling?.isActive ? 'danger' : 'primary'}
        title={toggling?.isActive ? `Deactivate ${toggling?.name}?` : `Activate ${toggling?.name ?? ''}?`}
        description={
          toggling?.isActive
            ? 'They will be signed out and can no longer access the dashboard. You can re-activate them later.'
            : 'They will be able to sign in again with their existing password.'
        }
        confirmLabel={toggling?.isActive ? 'Deactivate' : 'Activate'}
        onConfirm={() =>
          toggling &&
          update.mutate(
            { id: toggling.id, body: { isActive: !toggling.isActive } },
            {
              onSuccess: (u) => {
                toast.success(u.isActive ? `${u.name} activated` : `${u.name} deactivated`);
                setToggling(null);
              },
              onError: (err) => toast.error(getErrorMessage(err, 'Could not update the admin')),
            },
          )
        }
      />
    </Card>
  );
}

function AddAdminDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', email: '', phone: '', role: 'ADMIN', password: '' },
  });
  const close = () => {
    reset();
    onClose();
  };
  const onSubmit = handleSubmit(async (v) => {
    try {
      const created = await adminService.create({ ...v, phone: v.phone || undefined });
      qc.setQueryData<AdminProfile[]>(qk.admins, (old) => (old ? [...old, created] : [created]));
      toast.success(`${created.name} can now sign in`);
      close();
    } catch (err) {
      const applied = applyApiFieldErrors(err, setError, { knownFields: ['name', 'email', 'phone', 'role', 'password'] });
      if (!applied) toast.error(getErrorMessage(err, 'Could not add the admin'));
    }
  });
  return (
    <Dialog
      open={open}
      onClose={close}
      dismissible={!isSubmitting}
      title="Add admin"
      description="Share the password with them securely — they can change it from their profile."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="add-admin-form" loading={isSubmitting}>
            Add admin
          </Button>
        </>
      }
    >
      <form id="add-admin-form" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.name?.message}>
          <Input {...register('name')} autoComplete="off" data-autofocus />
        </Field>
        <Field label="Email" required error={errors.email?.message}>
          <Input {...register('email')} type="email" inputMode="email" autoComplete="off" />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <Input {...register('phone')} type="tel" inputMode="tel" />
        </Field>
        <Field label="Role" required error={errors.role?.message}>
          <Select {...register('role')}>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super admin</option>
          </Select>
        </Field>
        <Field label="Temporary password" required error={errors.password?.message} className="sm:col-span-2">
          <Input {...register('password')} type="password" autoComplete="new-password" />
        </Field>
        <div className="sm:col-span-2">
          <PasswordRules value={watch('password')} />
        </div>
        <p className="flex items-start gap-2 text-xs text-muted sm:col-span-2">
          <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden />
          Super admins can manage other admins. Regular admins can manage orders, products, categories and store settings.
        </p>
      </form>
    </Dialog>
  );
}

function ResetPasswordDialog({ admin, onClose }: { admin: AdminProfile | null; onClose: () => void }) {
  const schema = z.object({ password: passwordSchema });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ password: string }>({ resolver: zodResolver(schema), defaultValues: { password: '' } });
  const close = () => {
    reset();
    onClose();
  };
  const onSubmit = handleSubmit(async ({ password }) => {
    if (!admin) return;
    try {
      await adminService.update(admin.id, { password });
      toast.success(`Password reset for ${admin.name}`);
      close();
    } catch (err) {
      const applied = applyApiFieldErrors(err, setError, { knownFields: ['password'] });
      if (!applied) toast.error(getErrorMessage(err, 'Could not reset the password'));
    }
  });
  return (
    <Dialog
      open={!!admin}
      onClose={close}
      size="sm"
      dismissible={!isSubmitting}
      title={`Reset password for ${admin?.name ?? ''}`}
      description="Set a new temporary password and share it with them securely."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="reset-password-form" loading={isSubmitting}>
            Reset password
          </Button>
        </>
      }
    >
      <form id="reset-password-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
        <Field label="New password" required error={errors.password?.message}>
          <Input {...register('password')} type="password" autoComplete="new-password" data-autofocus />
        </Field>
        <PasswordRules value={watch('password')} />
      </form>
    </Dialog>
  );
}
