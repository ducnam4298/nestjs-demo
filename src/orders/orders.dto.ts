import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto } from '@/shared';

export class CreateOrderDto {}

export class FindAllOrderDto extends PartialType(PaginationRequestDto) {}

export class UpdateOrderDto extends PartialType(CreateOrderDto) {}
