import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { StoreModule } from '../stores/store.module';
import { AdminExchangesController } from './exchanges.controller';
import { ExchangesService } from './exchanges.service';

@Module({
  imports: [OrdersModule, StoreModule],
  controllers: [AdminExchangesController],
  providers: [ExchangesService],
  exports: [ExchangesService],
})
export class ExchangesModule {}
