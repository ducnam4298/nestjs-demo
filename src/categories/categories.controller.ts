import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, FindAllCategoryDto, UpdateCategoryDto } from './categories.dto';
import { ApiController, Metadata } from '@/access_control';
import { ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiController('Categories', FindAllCategoryDto)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('CREATE')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryDto })
  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('VIEWS')
  @ApiOperation({ summary: 'Get all categories' })
  @Get()
  async findAll(@Query() findAllCategoryDto: FindAllCategoryDto) {
    return this.categoriesService.findAll(findAllCategoryDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('DETAIL')
  @ApiOperation({ summary: 'Get a specific category by id' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('UPDATE')
  @ApiOperation({ summary: 'Update category by id' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @ApiBody({ type: UpdateCategoryDto })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('DELETE')
  @ApiOperation({ summary: 'Delete category by id' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
