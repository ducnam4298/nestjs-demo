import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttributeDto, FindAllAttributeDto, UpdateAttributeDto } from './attributes.dto';
import { DatabaseService } from '@/database';
import { FilterService, LoggerService, PaginationService } from '@/services';
import { retryTransaction } from '@/shared';

@Injectable()
export class AttributesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly filterService: FilterService,
    private readonly paginationService: PaginationService
  ) {}

  async create(createAttributeDto: CreateAttributeDto) {
    LoggerService.log(`ℹ️ Creating new attribute`, AttributesService.name);
    const id = await retryTransaction<string>(async () => {
      const newAttribute = await this.databaseService.attribute.create({
        data: createAttributeDto,
      });
      LoggerService.log(
        `✅ Attribute created successfully: ${newAttribute.id}`,
        AttributesService.name
      );
      return newAttribute.id;
    }, AttributesService.name);

    return id;
  }

  async findAll(findAllAttributeDto: FindAllAttributeDto) {
    const { page = 1, pageRecords = 10, sortBy, sortOrder, ...filters } = findAllAttributeDto;
    const model = 'attribute';
    LoggerService.log(
      `ℹ️ Finding attribute with filters: ${JSON.stringify(filters)}, page: ${page}, pageRecords: ${pageRecords}`,
      AttributesService.name
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
    LoggerService.log(`ℹ️ Finding attribute with ID: ${id}`, AttributesService.name);
    const attribute = await this.databaseService.attribute.findUnique({
      where: { id },
    });
    if (!attribute) {
      LoggerService.warn(`🚨 Attribute not found with ID: ${id}`, AttributesService.name);
      throw new NotFoundException('Attribute not found');
    }
    LoggerService.log(`✅ Attribute found: ${attribute.id}`, AttributesService.name);
    return attribute;
  }

  async update(id: string, updateAttributeDto: UpdateAttributeDto) {
    LoggerService.log(`ℹ️ Updating attribute with ID: ${id}`, AttributesService.name);
    const existingAttribute = await this.databaseService.attribute.findUnique({ where: { id } });
    if (!existingAttribute) {
      LoggerService.warn(
        `🚨 Attribute not found for update with ID: ${id}`,
        AttributesService.name
      );
      throw new NotFoundException('Attribute not found');
    }
    const updatedAttribute = await this.databaseService.attribute.update({
      where: { id },
      data: updateAttributeDto,
    });
    LoggerService.log(
      `✅ Attribute updated successfully: ${updatedAttribute.id}`,
      AttributesService.name
    );
    return updatedAttribute;
  }

  async remove(id: string) {
    LoggerService.log(`ℹ️ Removing attribute with ID: ${id}`, AttributesService.name);
    return this.databaseService.$transaction(async db => {
      const existingAttribute = await db.attribute.findUnique({ where: { id } });
      if (!existingAttribute) {
        LoggerService.warn(
          `🚨 Attribute not found for deletion with ID: ${id}`,
          AttributesService.name
        );
        throw new NotFoundException('Attribute not found');
      }
      await db.attribute.delete({ where: { id } });
      LoggerService.log(`✅ Attribute removed successfully: ${id}`, AttributesService.name);
      return id;
    });
  }
}
