import { Module } from '@nestjs/common';
import { AdminStoreController, StoreController } from './store.controller';
import { StoreService } from './store.service';

@Module({
  controllers: [StoreController, AdminStoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
