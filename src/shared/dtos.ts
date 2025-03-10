import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PaginationDto<T> {
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

  totalRecord: number;
  data: T[];

  constructor(data: T[], totalRecord: number, page: number, pageRecords: number) {
    this.data = data;
    this.totalRecord = totalRecord;
    this.page = page;
    this.pageRecords = pageRecords;
  }

  get skip(): number {
    return (this.page - 1) * this.pageRecords;
  }

  get take(): number {
    return this.pageRecords;
  }
}
