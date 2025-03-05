import { Global, Module } from '@nestjs/common';
import { UsersModule } from '@/users';
import { AuthModule } from '@/auth';
import { RolesModule } from '@/roles';
import { PermissionsModule } from '@/permissions';
import { EmployeesModule } from '@/employees';

@Global()
@Module({
  imports: [UsersModule, AuthModule, RolesModule, PermissionsModule, EmployeesModule], // 👈 Chuyển thành imports
  exports: [UsersModule, AuthModule, RolesModule, PermissionsModule, EmployeesModule],
})
export class CoreModule {}
