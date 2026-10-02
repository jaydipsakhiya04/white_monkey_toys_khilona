import { Customer } from '@prisma/client';

export interface CustomerProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  registeredAt: Date | null;
  createdAt: Date;
}

/** Public representation of a customer account. Never includes the password hash. */
export function toCustomerProfile(customer: Customer): CustomerProfile {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.accountEmail ?? customer.email,
    phone: customer.phone,
    registeredAt: customer.registeredAt,
    createdAt: customer.createdAt,
  };
}

/** Privacy-safe name for public display (reviews): "Jaydip Patel" → "Jaydip P." */
export function displayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Customer';
  const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  return parts.length > 1 ? `${first} ${parts[parts.length - 1].charAt(0).toUpperCase()}.` : first;
}
