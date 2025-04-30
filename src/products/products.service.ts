import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto, UpdateProductDto, FindAllProductDto } from './products.dto';
import { DatabaseService } from '@/database';
import { FilterService, LoggerService, PaginationService } from '@/services';

@Injectable()
export class ProductsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly filterService: FilterService,
    private readonly paginationService: PaginationService
  ) {}
  async create(createProductDto: CreateProductDto) {
    return 'This action adds a new product';
  }

  async findAll(findAllProductDto: FindAllProductDto) {
    const { page = 1, pageRecords = 10, sortBy, sortOrder, ...filters } = findAllProductDto;
    const model = 'product';
    LoggerService.log(
      `ℹ️ Finding products with filters: ${JSON.stringify(filters)}, page: ${page}, pageRecords: ${pageRecords}`,
      ProductsService.name
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
    LoggerService.log(`ℹ️ Finding product with ID: ${id}`, ProductsService.name);
    const product = await this.databaseService.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        images: true,
        attributes: { select: { id: true, attribute: true, value: true } },
        discounts: { select: { id: true, name: true, value: true } },
      },
    });
    if (!product) {
      LoggerService.warn(`🚨 Product not found with ID: ${id}`, ProductsService.name);
      throw new NotFoundException('Product not found');
    }
    LoggerService.log(`✅ Product found: ${product.id}`, ProductsService.name);
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async remove(id: string) {
    LoggerService.log(`ℹ️ Removing product with ID: ${id}`, ProductsService.name);
    return this.databaseService.$transaction(async db => {
      const existingProduct = await db.product.findUnique({ where: { id } });
      if (!existingProduct) {
        LoggerService.warn(
          `🚨 Product not found for deletion with ID: ${id}`,
          ProductsService.name
        );
        throw new NotFoundException('Product not found');
      }
      await db.product.delete({ where: { id } });
      LoggerService.log(`✅ Product removed successfully: ${id}`, ProductsService.name);
      return id;
    });
  }
}
