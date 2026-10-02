import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

export interface OrderEvent {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  itemsCount: number;
}

/**
 * A notification channel (WhatsApp, SMS, email, push…). Implementations can be registered
 * in NotificationsModule later without touching order logic.
 */
export interface NotificationChannel {
  readonly name: string;
  orderPlaced?(event: OrderEvent): Promise<void>;
  orderStatusChanged?(event: OrderEvent & { from: OrderStatus; to: OrderStatus }): Promise<void>;
}

export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');

/**
 * Fan-out point for order events. Notification failures are logged and never break
 * order placement or status updates. For the MVP no external channel is configured;
 * orders are reliably visible in the admin panel.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('Notifications');
  private readonly channels: NotificationChannel[] = [];

  register(channel: NotificationChannel) {
    this.channels.push(channel);
  }

  orderPlaced(event: OrderEvent) {
    this.logger.log(`Order ${event.orderNumber} placed by ${event.customerName} · ${event.itemsCount} item(s) · ₹${event.total}`);
    this.dispatch((c) => c.orderPlaced?.(event));
  }

  orderStatusChanged(event: OrderEvent & { from: OrderStatus; to: OrderStatus }) {
    this.logger.log(`Order ${event.orderNumber} status ${event.from} → ${event.to}`);
    this.dispatch((c) => c.orderStatusChanged?.(event));
  }

  private dispatch(fn: (channel: NotificationChannel) => Promise<void> | undefined) {
    for (const channel of this.channels) {
      Promise.resolve()
        .then(() => fn(channel))
        .catch((err) => this.logger.error(`Channel "${channel.name}" failed: ${(err as Error).message}`));
    }
  }
}
