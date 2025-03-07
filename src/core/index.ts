import { Global, Module } from '@nestjs/common';
import { UsersModule } from '@/users';
import { AuthModule } from '@/auth';
import { RolesModule } from '@/roles';
import { PermissionsModule } from '@/permissions';
import { EmployeesModule } from '@/employees';

@Global()
@Module({
  imports: [AuthModule, UsersModule, RolesModule, PermissionsModule, EmployeesModule],
  exports: [AuthModule, UsersModule, RolesModule, PermissionsModule, EmployeesModule],
})
export class CoreModule {}
