import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto, FindAllCategoryDto, UpdateCategoryDto } from './categories.dto';
import { FilterService, LoggerService, PaginationService } from '@/services';
import { validateIdsExistence } from '@/shared';
import { DatabaseService } from '@/database';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly filterService: FilterService,
    private readonly paginationService: PaginationService
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, parentId, categoryIds, attributeIds } = createCategoryDto;
    LoggerService.log(`ℹ️ Creating new category`, CategoriesService.name);
    const existingCategory = await this.databaseService.category.findFirst({
      where: { OR: [{ name }, { parentId }] },
    });

    if (existingCategory) {
      LoggerService.warn(
        `🚨 Category with this name or parentId already exists. Name: ${name}, ParentId: ${parentId}`,
        CategoriesService.name
      );
      throw new BadRequestException('Category with this name or parentId already exists');
    }

    const existingCategories = categoryIds
      ? await this.databaseService.category.findMany({
          where: {
            id: { in: categoryIds },
            parentId: null,
          },
        })
      : [];

    const eligibleSubCategoryIds = validateIdsExistence(
      existingCategories.map(r => r.id),
      attributeIds ?? []
    );

    const existingAttributes: { id: string; name: string }[] =
      await this.databaseService.attribute.findMany({
        where: { id: { in: attributeIds } },
        select: { id: true, name: true },
      });
    const eligibleAttributeIds = validateIdsExistence(
      existingAttributes.map(r => r.id),
      attributeIds ?? []
    );

    const id = await this.databaseService.$transaction(async db => {
      const newCategory = await db.category.create({
        data: {
          name,
          parentId,
          subCategories: {
            connect:
              eligibleSubCategoryIds.length > 0
                ? eligibleSubCategoryIds.map(id => ({ id }))
                : undefined,
          },
          attributes: {
            connect: eligibleAttributeIds.map(id => ({ id })),
          },
        },
      });
      return newCategory.id;
    });

    LoggerService.log(`✅ Category created successfully: ${id}`, CategoriesService.name);
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
      include: {
        subCategories: { select: { id: true, name: true } },
        attributes: { select: { id: true, name: true } },
      },
    });
    if (!category) {
      LoggerService.warn(`🚨 Category not found with ID: ${id}`, CategoriesService.name);
      throw new NotFoundException('Category not found');
    }
    LoggerService.log(`✅ Category found: ${category.id}`, CategoriesService.name);
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const { name, parentId, categoryIds, attributeIds } = updateCategoryDto;
    LoggerService.log(`ℹ️ Updating category with ID: ${id}`, CategoriesService.name);
    const existingCategory = await this.databaseService.category.findFirst({
      where: { AND: [{ OR: [{ name }, { parentId }] }, { NOT: { id } }] },
    });

    if (existingCategory) {
      LoggerService.warn(
        `🚨 Category with this name or parentId already exists. Name: ${name}, ParentId: ${parentId}, ID: ${id}`,
        CategoriesService.name
      );
      throw new BadRequestException('Category with this name or parentId already exists');
    }
    const currentCategory = await this.databaseService.category.findUnique({
      where: { id },
      include: {
        subCategories: { select: { id: true, name: true } },
        attributes: { select: { id: true, name: true } },
      },
    });
    if (!currentCategory) {
      LoggerService.error(
        `🚨 Category not found for update with ID: ${id}`,
        CategoriesService.name
      );
      throw new NotFoundException('Category not found');
    }
    const currentSubCategoryIds = currentCategory.subCategories.map(s => s.id);
    const currentAttributeIds = currentCategory.attributes.map(a => a.id);

    const connectSubCategoryIds = (categoryIds ?? []).filter(
      id => !currentSubCategoryIds.includes(id)
    );
    const connectAttributeIds = (attributeIds ?? []).filter(
      id => !currentAttributeIds.includes(id)
    );

    const disconnectSubCategoryIds = currentSubCategoryIds.filter(
      id => !(categoryIds ?? []).includes(id)
    );
    const disconnectAttributeIds = currentAttributeIds.filter(
      id => !(attributeIds ?? []).includes(id)
    );

    await this.databaseService.$transaction(async db => {
      await db.category.update({
        where: { id },
        data: {
          name: name ?? currentCategory.name,
          parentId: parentId ?? currentCategory.parentId,
          subCategories: {
            connect: connectSubCategoryIds.map(id => ({ id })),
            disconnect: disconnectSubCategoryIds.map(id => ({ id })),
          },
          attributes: {
            connect: connectAttributeIds.map(id => ({ id })),
            disconnect: disconnectAttributeIds.map(id => ({ id })),
          },
        },
      });
    });

    return id;
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
