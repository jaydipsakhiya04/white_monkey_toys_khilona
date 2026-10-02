import { Inject, Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { APP_CONFIG, AppConfig } from '../config/configuration';

export interface OrderEvent {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  itemsCount: number;
}

export interface PasswordResetEvent {
  customerId: string;
  name: string;
  email: string | null;
  phone: string;
  resetUrl: string;
  expiresAt: Date;
}

/**
 * A notification channel (WhatsApp, SMS, email, push…). Implementations can be registered
 * in NotificationsModule later without touching order or account logic.
 */
export interface NotificationChannel {
  readonly name: string;
  orderPlaced?(event: OrderEvent): Promise<void>;
  orderStatusChanged?(event: OrderEvent & { from: OrderStatus; to: OrderStatus }): Promise<void>;
  passwordResetRequested?(event: PasswordResetEvent): Promise<void>;
}

export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');

/**
 * Fan-out point for order and account events. Notification failures are logged and never
 * break order placement, status updates or account flows. No external channel ships with
 * the project; register one (email / SMS / WhatsApp) to deliver messages to customers.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('Notifications');
  private readonly channels: NotificationChannel[] = [];

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  register(channel: NotificationChannel) {
    this.channels.push(channel);
  }

  /** True when at least one registered channel can deliver password-reset links. */
  canDeliverPasswordResets(): boolean {
    return this.channels.some((c) => typeof c.passwordResetRequested === 'function');
  }

  orderPlaced(event: OrderEvent) {
    this.logger.log(`Order ${event.orderNumber} placed by ${event.customerName} · ${event.itemsCount} item(s) · ₹${event.total}`);
    this.dispatch((c) => c.orderPlaced?.(event));
  }

  orderStatusChanged(event: OrderEvent & { from: OrderStatus; to: OrderStatus }) {
    this.logger.log(`Order ${event.orderNumber} status ${event.from} → ${event.to}`);
    this.dispatch((c) => c.orderStatusChanged?.(event));
  }

  passwordResetRequested(event: PasswordResetEvent) {
    this.logger.log(`Password reset requested for customer ${event.customerId}`);
    // Development convenience only: the link is a secret, never log it in production.
    if (!this.config.isProduction && this.config.env !== 'test') {
      this.logger.warn(`[dev] Password reset link for ${event.email ?? event.phone}: ${event.resetUrl}`);
    }
    this.dispatch((c) => c.passwordResetRequested?.(event));
  }

  private dispatch(fn: (channel: NotificationChannel) => Promise<void> | undefined) {
    for (const channel of this.channels) {
      Promise.resolve()
        .then(() => fn(channel))
        .catch((err) => this.logger.error(`Channel "${channel.name}" failed: ${(err as Error).message}`));
    }
  }
}
