import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBrandDto, FindAllBrandDto, UpdateBrandDto } from './brands.dto';
import { FilterService, LoggerService, PaginationService } from '@/services';
import { DatabaseService } from '@/database';
import { retryTransaction } from '@/shared';

@Injectable()
export class BrandsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly filterService: FilterService,
    private readonly paginationService: PaginationService
  ) {}
  async create(createBrandDto: CreateBrandDto) {
    const { name, productIds } = createBrandDto;
    const existingBrand = await this.databaseService.brand.findUnique({
      where: { name },
    });

    if (existingBrand) {
      LoggerService.warn(
        `🚨 Brand with this name already exists. Name: ${name}`,
        BrandsService.name
      );
      throw new BadRequestException('Brand with this name already exists');
    }
    const id = await retryTransaction<string>(async () => {
      const newBrand = await this.databaseService.brand.create({
        data: {
          ...createBrandDto,
          products: {
            connect: productIds?.map(id => ({ id })) ?? [],
          },
        },
      });
      LoggerService.log(`✅ Brand created successfully: ${newBrand.id}`, BrandsService.name);
      return newBrand.id;
    }, BrandsService.name);

    return id;
  }

  async findAll(findAllBrandDto: FindAllBrandDto) {
    const { page = 1, pageRecords = 10, sortBy, sortOrder, ...filters } = findAllBrandDto;
    const model = 'brand';
    LoggerService.log(
      `ℹ️ Finding brands with filters: ${JSON.stringify(filters)}, page: ${page}, pageRecords: ${pageRecords}`,
      BrandsService.name
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
    LoggerService.log(`ℹ️ Finding brand with ID: ${id}`, BrandsService.name);
    const brand = await this.databaseService.brand.findUnique({
      where: { id },
      include: { products: { select: { id: true, name: true } } },
    });
    if (!brand) {
      LoggerService.warn(`🚨 Brand not found with ID: ${id}`, BrandsService.name);
      throw new NotFoundException('Brand not found');
    }
    LoggerService.log(`✅ Brand found: ${brand.id}`, BrandsService.name);
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const { name, logoUrl, productIds } = updateBrandDto;
    const existingBrand = await this.databaseService.brand.findUnique({
      where: { id },
      include: { products: { select: { id: true, name: true } } },
    });
    if (!existingBrand) {
      LoggerService.warn(`🚨 Brand not found for update with ID: ${id}`, BrandsService.name);
      throw new NotFoundException('Brand not found');
    }
    const currentProductIds = existingBrand.products.map(s => s.id);
    const connectProductIds = (productIds ?? []).filter(id => !currentProductIds.includes(id));
    const disconnectProductIds = currentProductIds.filter(id => !(productIds ?? []).includes(id));

    const updatedBrand = await this.databaseService.brand.update({
      where: { id },
      data: {
        name,
        logoUrl,
        products: {
          connect: connectProductIds.map(id => ({ id })),
          disconnect: disconnectProductIds.map(id => ({ id })),
        },
      },
    });
    LoggerService.log(`✅ Brand updated successfully: ${updatedBrand.id}`, BrandsService.name);
    return updatedBrand;
  }

  async remove(id: string) {
    LoggerService.log(`ℹ️ Removing brand with ID: ${id}`, BrandsService.name);
    return this.databaseService.$transaction(async db => {
      const existingBrand = await db.brand.findUnique({ where: { id } });
      if (!existingBrand) {
        LoggerService.warn(`🚨 Brand not found for deletion with ID: ${id}`, BrandsService.name);
        throw new NotFoundException('Brand not found');
      }
      await db.brand.delete({ where: { id } });
      LoggerService.log(`✅ Brand removed successfully: ${id}`, BrandsService.name);
      return id;
    });
  }
}
