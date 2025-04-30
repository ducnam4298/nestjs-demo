import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, FindAllProductDto, UpdateProductDto } from './products.dto';
import { ApiController, Metadata } from '@/access_control';

@ApiController('Products', FindAllProductDto)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('CREATE')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBody({ type: CreateProductDto })
  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('VIEWS')
  @ApiOperation({ summary: 'Get all products' })
  @Get()
  async findAll(@Query() findAllProductDto: FindAllProductDto) {
    return this.productsService.findAll(findAllProductDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('DETAIL')
  @ApiOperation({ summary: 'Get a specific product by id' })
  @ApiParam({ name: 'id', type: String, description: 'Product ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('UPDATE')
  @ApiOperation({ summary: 'Update product by id' })
  @ApiParam({ name: 'id', type: String, description: 'Product ID' })
  @ApiBody({ type: UpdateProductDto })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('DELETE')
  @ApiOperation({ summary: 'Delete product by id' })
  @ApiParam({ name: 'id', type: String, description: 'Product ID' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
