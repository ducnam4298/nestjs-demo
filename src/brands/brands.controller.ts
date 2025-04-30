import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto, FindAllBrandDto, UpdateBrandDto } from './brands.dto';
import { ApiController, Metadata } from '@/access_control';

@ApiController('Brands', FindAllBrandDto)
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('CREATE')
  @ApiOperation({ summary: 'Create a new brand' })
  @ApiBody({ type: CreateBrandDto })
  @Post()
  async create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('VIEWS')
  @ApiOperation({ summary: 'Get all brands' })
  @Get()
  async findAll(@Query() findAllBrandDto: FindAllBrandDto) {
    return this.brandsService.findAll(findAllBrandDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('DETAIL')
  @ApiOperation({ summary: 'Get a specific brand by id' })
  @ApiParam({ name: 'id', type: String, description: 'Brand ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('UPDATE')
  @ApiOperation({ summary: 'Update brand by id' })
  @ApiParam({ name: 'id', type: String, description: 'Brand ID' })
  @ApiBody({ type: UpdateBrandDto })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('DELETE')
  @ApiOperation({ summary: 'Delete brand by id' })
  @ApiParam({ name: 'id', type: String, description: 'Brand ID' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
