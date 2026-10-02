import { Module } from '@nestjs/common';
import { StoreModule } from '../stores/store.module';
import { AdminReviewsController, CustomerReviewsController, ProductReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [StoreModule],
  controllers: [ProductReviewsController, CustomerReviewsController, AdminReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
