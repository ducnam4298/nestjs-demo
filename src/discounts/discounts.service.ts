import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDiscountDto, FindAllDiscountDto, UpdateDiscountDto } from './discounts.dto';
import { DatabaseService } from '@/database';
import { FilterService, LoggerService, PaginationService } from '@/services';
import { retryTransaction } from '@/shared';

@Injectable()
export class DiscountsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly filterService: FilterService,
    private readonly paginationService: PaginationService
  ) {}
  async create(createDiscountDto: CreateDiscountDto) {
    LoggerService.log(`ℹ️ Creating new discount`, DiscountsService.name);
    const id = await retryTransaction<string>(async () => {
      const newDiscount = await this.databaseService.discount.create({
        data: createDiscountDto,
      });
      LoggerService.log(
        `✅ Discount created successfully: ${newDiscount.id}`,
        DiscountsService.name
      );
      return newDiscount.id;
    }, DiscountsService.name);

    return id;
  }

  async findAll(findAllDiscountDto: FindAllDiscountDto) {
    const { page = 1, pageRecords = 10, sortBy, sortOrder, ...filters } = findAllDiscountDto;
    const model = 'discount';
    LoggerService.log(
      `ℹ️ Finding discount with filters: ${JSON.stringify(filters)}, page: ${page}, pageRecords: ${pageRecords}`,
      DiscountsService.name
    );

    const { sortBy: finalSortBy, sortOrder: finalSortOrder } =
      await this.filterService.getValidSortField(model, sortBy, sortOrder);

    return this.paginationService.paginate(
      model,
      filters,
      page,
      pageRecords,
      finalSortBy,
      finalSortOrder
    );
  }

  async findOne(id: string) {
    LoggerService.log(`ℹ️ Finding discount with ID: ${id}`, DiscountsService.name);
    const discount = await this.databaseService.discount.findUnique({
      where: { id },
    });
    if (!discount) {
      LoggerService.warn(`🚨 Discount not found with ID: ${id}`, DiscountsService.name);
      throw new NotFoundException('Discount not found');
    }
    LoggerService.log(`✅ Discount found: ${discount.id}`, DiscountsService.name);
    return discount;
  }

  async update(id: string, updateDiscountDto: UpdateDiscountDto) {
    LoggerService.log(`ℹ️ Updating discount with ID: ${id}`, DiscountsService.name);
    const existingDiscount = await this.databaseService.discount.findUnique({ where: { id } });
    if (!existingDiscount) {
      LoggerService.warn(`🚨 Discount not found for update with ID: ${id}`, DiscountsService.name);
      throw new NotFoundException('Discount not found');
    }
    const updatedDiscount = await this.databaseService.discount.update({
      where: { id },
      data: updateDiscountDto,
    });
    LoggerService.log(
      `✅ Discount updated successfully: ${updatedDiscount.id}`,
      DiscountsService.name
    );
    return updatedDiscount;
  }

  async remove(id: string) {
    LoggerService.log(`ℹ️ Removing discount with ID: ${id}`, DiscountsService.name);
    return this.databaseService.$transaction(async db => {
      const existingDiscount = await db.discount.findUnique({ where: { id } });
      if (!existingDiscount) {
        LoggerService.warn(
          `🚨 Discount not found for deletion with ID: ${id}`,
          DiscountsService.name
        );
        throw new NotFoundException('Discount not found');
      }
      await db.discount.delete({ where: { id } });
      LoggerService.log(`✅ Discount removed successfully: ${id}`, DiscountsService.name);
      return id;
    });
  }
}
