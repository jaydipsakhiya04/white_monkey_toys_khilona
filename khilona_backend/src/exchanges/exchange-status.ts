import { ExchangeReason, ExchangeStatus } from '@prisma/client';

/** REQUESTED → APPROVED / REJECTED; APPROVED → COMPLETED / REJECTED. REJECTED and COMPLETED are final. */
export const EXCHANGE_TRANSITIONS: Record<ExchangeStatus, ExchangeStatus[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['COMPLETED', 'REJECTED'],
  REJECTED: [],
  COMPLETED: [],
};

export const EXCHANGE_STATUS_LABELS: Record<ExchangeStatus, string> = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

export const EXCHANGE_REASON_LABELS: Record<ExchangeReason, string> = {
  WRONG_ITEM: 'Received a wrong item',
  DAMAGED_ITEM: 'Item arrived broken / damaged',
};
