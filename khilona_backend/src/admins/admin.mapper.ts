import { Admin } from '@prisma/client';

export type AdminProfile = Pick<Admin, 'id' | 'name' | 'email' | 'phone' | 'role' | 'isActive' | 'lastLoginAt' | 'createdAt'>;

/** Public representation of an admin. Never includes the password hash. */
export function toAdminProfile(admin: Admin): AdminProfile {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    role: admin.role,
    isActive: admin.isActive,
    lastLoginAt: admin.lastLoginAt,
    createdAt: admin.createdAt,
  };
}

export const BCRYPT_ROUNDS = 12;
