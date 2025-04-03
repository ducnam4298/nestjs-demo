import { Expose, Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationRequestDto {
  @ApiProperty({
    description: 'The page number to retrieve.',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiProperty({
    description: 'The number of records per page.',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Type(() => Number)
  pageRecords: number = 10;

  @ApiProperty({
    description: 'The field by which the result should be sorted.',
    example: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    description: 'The order in which to sort the result.',
    example: 'asc',
    required: false,
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  get skip(): number {
    return (this.page - 1) * this.pageRecords;
  }

  get take(): number {
    return this.pageRecords;
  }
}

export class PaginationResponseDto<T> {
  @Expose()
  data: T[];

  @Expose()
  totalRecord: number;

  @Expose()
  page: number;

  @Expose()
  pageRecords: number;

  constructor(data: T[], totalRecord: number, page: number, pageRecords: number) {
    this.data = data;
    this.totalRecord = totalRecord;
    this.page = page;
    this.pageRecords = pageRecords;
  }
}

export interface TokenPayload {
  userId?: string;
  deviceId?: string;
  iat?: number;
  exp?: number;
}
