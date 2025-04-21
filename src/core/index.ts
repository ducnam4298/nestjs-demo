import { MailModule } from '@/mail/mail.module';
import { Global, Module } from '@nestjs/common';
import { UsersModule } from '@/users';
import { AuthModule } from '@/auth';
import { RolesModule } from '@/roles';
import { PermissionsModule } from '@/permissions';
import { EmployeesModule } from '@/employees';
import { FilterService, PaginationService } from '@/services';
import { ProductsModule } from '@/products';
import { CategoriesModule } from '@/categories';
import { OrdersModule } from '@/orders';
import { DiscountsModule } from '@/discounts';

@Global()
@Module({
  imports: [
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    EmployeesModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    DiscountsModule,
    MailModule,
  ],
  providers: [FilterService, PaginationService],
  exports: [
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    EmployeesModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    DiscountsModule,
    MailModule,
    FilterService,
    PaginationService,
  ],
})
export class CoreModule {}
