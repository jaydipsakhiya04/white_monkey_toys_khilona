import type { HTMLAttributes } from 'react';
import type { OrderStatus, PaymentStatus, StockStatus } from '@/types/api';
import { cn } from '@/utils/cn';
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STYLE,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_STYLE,
  STOCK_STATUS_LABEL,
  STOCK_STATUS_STYLE,
} from '@/utils/status';

type Tone = 'neutral' | 'brand' | 'info' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'bg-stone-100 text-stone-700 ring-stone-200',
  brand: 'bg-brand-tint text-brand-hover ring-orange-200',
  info: 'bg-info-tint text-info ring-teal-200',
  success: 'bg-green-50 text-green-700 ring-green-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const style = ORDER_STATUS_STYLE[status];
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-xs font-medium ring-1 ring-inset',
        style.badge,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', style.dot)} aria-hidden />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center whitespace-nowrap rounded-md px-2 text-xs font-medium ring-1 ring-inset',
        PAYMENT_STATUS_STYLE[status],
        className,
      )}
    >
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}

export function StockBadge({ status, stock, className }: { status: StockStatus; stock?: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs font-medium ring-1 ring-inset tabular',
        STOCK_STATUS_STYLE[status],
        className,
      )}
    >
      {status === 'OUT_OF_STOCK' ? STOCK_STATUS_LABEL[status] : stock !== undefined ? `${stock} in stock` : STOCK_STATUS_LABEL[status]}
      {status === 'LOW_STOCK' && <span className="sr-only">(low)</span>}
    </span>
  );
}
