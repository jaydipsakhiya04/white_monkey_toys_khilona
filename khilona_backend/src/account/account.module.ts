import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { OrdersModule } from '../orders/orders.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { StoreModule } from '../stores/store.module';
import { AccountController, GuestDocumentsController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [OrdersModule, ReviewsModule, DocumentsModule, StoreModule],
  controllers: [AccountController, GuestDocumentsController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
