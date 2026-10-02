import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { AdminProductsService } from './admin-products.service';
import { AdminProductsController, ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [CategoriesModule],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService, AdminProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
