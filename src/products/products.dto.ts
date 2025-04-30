import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationRequestDto } from '@/shared';

export class CreateProductDto {}

export class FindAllProductDto extends PartialType(PaginationRequestDto) {}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
