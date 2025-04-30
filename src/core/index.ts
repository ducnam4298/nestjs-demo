import { Global, Module } from '@nestjs/common';
import { AttributesModule } from '@/attributes';
import { AuthModule } from '@/auth';
import { BrandsModule } from '@/brands';
import { CategoriesModule } from '@/categories';
import { DiscountsModule } from '@/discounts';
import { EmployeesModule } from '@/employees';
import { MailModule } from '@/mail';
import { OrdersModule } from '@/orders';
import { PermissionsModule } from '@/permissions';
import { ProductsModule } from '@/products';
import { RolesModule } from '@/roles';
import { FilterService, PaginationService } from '@/services';
import { UsersModule } from '@/users';

@Global()
@Module({
  imports: [
    AttributesModule,
    AuthModule,
    BrandsModule,
    CategoriesModule,
    DiscountsModule,
    EmployeesModule,
    MailModule,
    OrdersModule,
    PermissionsModule,
    ProductsModule,
    RolesModule,
    UsersModule,
  ],
  providers: [FilterService, PaginationService],
  exports: [
    AttributesModule,
    AuthModule,
    BrandsModule,
    CategoriesModule,
    DiscountsModule,
    EmployeesModule,
    MailModule,
    OrdersModule,
    PermissionsModule,
    ProductsModule,
    RolesModule,
    UsersModule,
    //
    FilterService,
    PaginationService,
  ],
})
export class CoreModule {}
