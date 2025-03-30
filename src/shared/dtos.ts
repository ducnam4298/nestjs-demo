import { Expose, Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PaginationRequestDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Type(() => Number)
  pageRecords: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string;

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
