import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto, FindAllCategoryDto, UpdateCategoryDto } from './categories.dto';
import { FilterService, LoggerService, PaginationService } from '@/services';
import { retryTransaction } from '@/shared';
import { DatabaseService } from '@/database';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly filterService: FilterService,
    private readonly paginationService: PaginationService
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, parentId, categoryIds } = createCategoryDto;
    LoggerService.log(`ℹ️ Creating new category`, CategoriesService.name);

    const eligibleSubCategories = categoryIds
      ? await this.databaseService.category.findMany({
          where: {
            id: { in: categoryIds },
            parentId: null,
          },
        })
      : [];
    const eligibleSubCategoryIds = eligibleSubCategories.map(c => c.id);
    const ineligibleSubCategoryIds = categoryIds
      ? categoryIds.filter(id => !eligibleSubCategoryIds.includes(id))
      : [];

    if (ineligibleSubCategoryIds.length > 0) {
      LoggerService.warn(
        `🚨 The following subCategoryIds are either invalid or already assigned to a parent: ${ineligibleSubCategoryIds.join(',')}`
      );
    }

    const id = await retryTransaction<string>(async () => {
      const newCategory = await this.databaseService.category.create({
        data: {
          name,
          parentId,
          subCategories: {
            connect: eligibleSubCategoryIds.map(id => ({ id })),
          },
        },
      });
      LoggerService.log(
        `✅ Category created successfully: ${newCategory.id}`,
        CategoriesService.name
      );
      return newCategory.id;
    }, CategoriesService.name);

    return id;
  }

  async findAll(findAllCategories: FindAllCategoryDto) {
    const { page = 1, pageRecords = 10, sortBy, sortOrder, ...filters } = findAllCategories;
    const model = 'category';
    LoggerService.log(
      `ℹ️ Finding categories with filters: ${JSON.stringify(filters)}, page: ${page}, pageRecords: ${pageRecords}`,
      CategoriesService.name
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
    LoggerService.log(`ℹ️ Finding category with ID: ${id}`, CategoriesService.name);
    const category = await this.databaseService.category.findUnique({
      where: { id },
      include: { subCategories: true },
    });
    if (!category) {
      LoggerService.warn(`🚨 Category not found with ID: ${id}`, CategoriesService.name);
      throw new NotFoundException('Category not found');
    }
    LoggerService.log(`✅ Category found: ${category.id}`, CategoriesService.name);
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const { name, parentId, categoryIds } = updateCategoryDto;
    LoggerService.log(`ℹ️ Updating category with ID: ${id}`, CategoriesService.name);
    const currentCategory = await this.databaseService.category.findUnique({
      where: { id },
      include: { subCategories: true },
    });
    if (!currentCategory) {
      LoggerService.warn(`🚨 Category not found for update with ID: ${id}`, CategoriesService.name);
      throw new NotFoundException('Category not found');
    }

    const eligibleSubCategories = categoryIds
      ? await this.databaseService.category.findMany({
          where: {
            id: { in: categoryIds.filter(subId => subId !== id) },
            parentId: null,
          },
        })
      : [];
    const eligibleIds = eligibleSubCategories.map(c => c.id);
    const ineligibleIds = categoryIds ? categoryIds.filter(id => !eligibleIds.includes(id)) : [];

    if (ineligibleIds.length > 0) {
      LoggerService.warn(
        `🚨 These subCategoryIds are invalid, already have a parent, or trying to be their own parent: ${ineligibleIds.join(', ')}`
      );
    }
    const updatedCategory = await this.databaseService.category.update({
      where: { id },
      data: {
        name: name ?? currentCategory.name,
        parentId: parentId ?? currentCategory.parentId,
        subCategories: {
          connect: eligibleIds.map(id => ({ id })),
        },
      },
    });
    LoggerService.log(
      `✅ Category updated successfully: ${updatedCategory.id}`,
      CategoriesService.name
    );
    return updatedCategory;
  }

  remove(id: string) {
    LoggerService.log(`ℹ️ Removing category with ID: ${id}`, CategoriesService.name);
    return this.databaseService.$transaction(async db => {
      const existingCategory = await db.category.findUnique({ where: { id } });
      if (!existingCategory) {
        LoggerService.warn(
          `🚨 Category not found for deletion with ID: ${id}`,
          CategoriesService.name
        );
        throw new NotFoundException('Category not found');
      }
      await db.category.delete({ where: { id } });
      LoggerService.log(`✅ Category removed successfully: ${id}`, CategoriesService.name);
      return id;
    });
  }
}
