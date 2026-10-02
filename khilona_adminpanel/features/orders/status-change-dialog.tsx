'use client';

import { useState } from 'react';
import { OrderStatusBadge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/input';
import type { OrderStatus } from '@/types/api';
import { ORDER_STATUS_LABEL } from '@/utils/status';
import { useUpdateOrderStatus } from './hooks';

export type PendingStatusChange = { orderId: string; orderNumber: string; from: OrderStatus; to: OrderStatus };

/** Confirmation dialog used for destructive / final transitions (CANCELLED, DELIVERED). */
export function StatusChangeDialog({
  change,
  onClose,
  initialNote = '',
  onDone,
}: {
  change: PendingStatusChange | null;
  onClose: () => void;
  initialNote?: string;
  onDone?: () => void;
}) {
  const mutation = useUpdateOrderStatus();
  const [note, setNote] = useState(initialNote);
  const open = !!change;
  const isCancel = change?.to === 'CANCELLED';

  const confirm = () => {
    if (!change) return;
    mutation.mutate(
      { id: change.orderId, status: change.to, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setNote('');
          onDone?.();
          onClose();
        },
      },
    );
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={() => {
        if (!mutation.isPending) onClose();
      }}
      onConfirm={confirm}
      loading={mutation.isPending}
      tone={isCancel ? 'danger' : 'primary'}
      title={isCancel ? `Cancel order ${change?.orderNumber ?? ''}?` : `Mark ${change?.orderNumber ?? ''} as delivered?`}
      confirmLabel={isCancel ? 'Cancel order' : 'Mark as delivered'}
      cancelLabel="Go back"
    >
      {change && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <OrderStatusBadge status={change.from} />
            <span aria-hidden>→</span>
            <span className="sr-only">will change to</span>
            <OrderStatusBadge status={change.to} />
          </div>
          {isCancel ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] leading-relaxed text-amber-900">
              Cancelling is final. The items in this order will be <strong>returned to stock</strong> automatically (only once),
              and the customer can no longer be moved to another status.
            </div>
          ) : (
            <div className="rounded-lg border border-line bg-page px-3 py-2.5 text-[13px] leading-relaxed text-ink-soft">
              Delivered is a final status — it can&apos;t be changed afterwards. The order total will count towards delivered revenue.
              Remember to mark the payment as <strong>Paid</strong> once cash is collected.
            </div>
          )}
          <Field label="Note (optional)" hint={`Saved in the order timeline with the move to “${ORDER_STATUS_LABEL[change.to]}”.`}>
            <Textarea
              rows={3}
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder={isCancel ? 'e.g. Customer asked to cancel on call' : 'e.g. Handed over to customer'}
            />
          </Field>
        </div>
      )}
    </ConfirmDialog>
  );
}
