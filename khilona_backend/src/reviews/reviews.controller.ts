import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiConflictResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuth, AuthenticatedAdmin, CurrentAdmin } from '../common/decorators/auth.decorators';
import { AuthenticatedCustomer, CurrentCustomer, CustomerAuth } from '../common/decorators/customer-auth.decorators';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { AdminReviewQueryDto, AdminReviewStatusDto, CreateReviewDto, PublicReviewQueryDto, UpdateReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('products')
export class ProductReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get(':slug/reviews')
  @ResponseMessage('Reviews fetched successfully')
  @ApiOperation({ summary: 'Published reviews of a product with rating summary and distribution' })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        message: 'Reviews fetched successfully',
        data: {
          summary: { average: 4.8, count: 24, distribution: { '5': 20, '4': 3, '3': 1, '2': 0, '1': 0 } },
          items: [
            {
              id: 'clx0rev0001',
              rating: 5,
              comment: 'Sturdy and fun.',
              authorName: 'Jaydip P.',
              variantTitle: 'Red',
              verifiedPurchase: true,
              createdAt: '2026-10-02T10:00:00.000Z',
            },
          ],
          meta: { page: 1, limit: 10, total: 24, totalPages: 3, hasNextPage: true, hasPrevPage: false },
        },
      },
    },
  })
  @ApiNotFoundResponse()
  list(@Param('slug') slug: string, @Query() query: PublicReviewQueryDto) {
    return this.reviews.publicList(slug, query);
  }
}

@ApiTags('Customer · Reviews')
@Controller('customer/reviews')
@CustomerAuth()
export class CustomerReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  @ResponseMessage('Reviews fetched successfully')
  @ApiOperation({ summary: 'Reviews written by the signed-in customer' })
  mine(@CurrentCustomer() customer: AuthenticatedCustomer, @Query() query: PaginationQueryDto) {
    return this.reviews.mine(customer, query.page, query.limit);
  }

  @Post()
  @ResponseMessage('Thanks! Your review has been submitted')
  @ApiOperation({ summary: 'Review a product from one of your delivered orders (verified purchase)' })
  @ApiForbiddenResponse({ description: 'Order not delivered yet / product not in the order' })
  @ApiConflictResponse({ description: 'Already reviewed for this order' })
  create(@CurrentCustomer() customer: AuthenticatedCustomer, @Body() dto: CreateReviewDto) {
    return this.reviews.create(customer, dto);
  }

  @Patch(':id')
  @ResponseMessage('Review updated')
  @ApiOperation({ summary: 'Edit your own review' })
  update(@CurrentCustomer() customer: AuthenticatedCustomer, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviews.update(customer, id, dto);
  }

  @Delete(':id')
  @ResponseMessage('Review deleted')
  @ApiOperation({ summary: 'Delete your own review' })
  async remove(@CurrentCustomer() customer: AuthenticatedCustomer, @Param('id') id: string) {
    await this.reviews.remove(customer, id);
    return null;
  }
}

@ApiTags('Admin · Reviews')
@Controller('admin/reviews')
@AdminAuth()
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  @ResponseMessage('Reviews fetched successfully')
  @ApiOperation({ summary: 'List / filter reviews for moderation (+ counts per status)' })
  list(@Query() query: AdminReviewQueryDto) {
    return this.reviews.adminList(query);
  }

  @Patch(':id/status')
  @ResponseMessage('Review status updated')
  @ApiOperation({ summary: 'Publish or hide a review (review text and rating cannot be edited by admins)' })
  setStatus(@Param('id') id: string, @Body() dto: AdminReviewStatusDto, @CurrentAdmin() admin: AuthenticatedAdmin) {
    return this.reviews.adminSetStatus(id, dto.status, admin);
  }
}
