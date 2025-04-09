import { MailModule } from '@/mail/mail.module';
import { Global, Module } from '@nestjs/common';
import { UsersModule } from '@/users';
import { AuthModule } from '@/auth';
import { RolesModule } from '@/roles';
import { PermissionsModule } from '@/permissions';
import { EmployeesModule } from '@/employees';
import { FilterService, PaginationService } from '@/services';

@Global()
@Module({
  imports: [AuthModule, UsersModule, RolesModule, PermissionsModule, EmployeesModule, MailModule],
  providers: [FilterService, PaginationService],
  exports: [
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    EmployeesModule,
    MailModule,
    FilterService,
    PaginationService,
  ],
})
export class CoreModule {}
