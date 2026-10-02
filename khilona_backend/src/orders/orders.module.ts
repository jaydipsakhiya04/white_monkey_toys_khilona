import { Module } from '@nestjs/common';
import { StoreModule } from '../stores/store.module';
import { CartPricingService } from './cart-pricing.service';
import { OrderNumberService } from './order-number.service';
import { AdminOrdersController, OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [StoreModule],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, CartPricingService, OrderNumberService],
  exports: [OrdersService],
})
export class OrdersModule {}
