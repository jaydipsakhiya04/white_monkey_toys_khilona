'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useId, useRef, useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { cn } from '@/utils/cn';
import { Button } from './button';

const subscribe = () => () => {};
/** true on the client after hydration */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Prevent closing on overlay click / Esc (e.g. while saving) */
  dismissible?: boolean;
  initialFocus?: RefObject<HTMLElement | null>;
  role?: 'dialog' | 'alertdialog';
  className?: string;
};

const sizes = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible = true,
  initialFocus,
  role = 'dialog',
  className,
}: DialogProps) {
  const isClient = useIsClient();
  if (!isClient || !open) return null;
  return createPortal(
    <DialogInner
      onClose={onClose}
      title={title}
      description={description}
      footer={footer}
      size={size}
      dismissible={dismissible}
      initialFocus={initialFocus}
      role={role}
      className={className}
    >
      {children}
    </DialogInner>,
    document.body,
  );
}

function DialogInner({
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissible,
  initialFocus,
  role,
  className,
}: Omit<DialogProps, 'open'>) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useFocusTrap(ref, true, () => dismissible && onClose(), { initialFocus });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-stone-900/40"
        aria-hidden
        onClick={() => dismissible && onClose()}
      />
      <div
        ref={ref}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-slide-up flex-col overflow-hidden rounded-t-2xl bg-surface shadow-pop outline-none sm:rounded-xl',
          sizes[size ?? 'md'],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-[13px] leading-relaxed text-muted">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close dialog" className="-mr-2 -mt-1">
              <X />
            </Button>
          )}
        </div>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line bg-page/60 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
  confirmDisabled?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading,
  confirmDisabled,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      role="alertdialog"
      size="sm"
      dismissible={!loading}
      initialFocus={cancelRef}
      title={
        <span className="flex items-center gap-2">
          {tone === 'danger' && <AlertTriangle className="size-4 text-danger" aria-hidden />}
          {title}
        </span>
      }
      description={description}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: 'right' | 'left';
  width?: string;
  dismissible?: boolean;
};

export function Sheet(props: SheetProps) {
  const isClient = useIsClient();
  if (!isClient || !props.open) return null;
  return createPortal(<SheetInner {...props} />, document.body);
}

function SheetInner({
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  width = 'sm:max-w-xl',
  dismissible = true,
}: SheetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref, true, () => dismissible && onClose());
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-stone-900/40" aria-hidden onClick={() => dismissible && onClose()} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 flex w-full flex-col bg-surface shadow-pop outline-none',
          width,
          side === 'right' ? 'right-0 animate-slide-in-right' : 'left-0 animate-slide-in-left',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
          </div>
          {dismissible && (
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close panel" className="-mr-2 -mt-1">
              <X />
            </Button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex gap-2 border-t border-line bg-page/60 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:justify-end [&>*]:flex-1 sm:[&>*]:flex-none">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
