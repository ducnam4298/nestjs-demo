import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { ApiController, Metadata } from '@/access_control';
import { CreateDiscountDto, FindAllDiscountDto, UpdateDiscountDto } from './discounts.dto';
import { DiscountsService } from './discounts.service';

@ApiController('Discounts', FindAllDiscountDto)
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('CREATE')
  @ApiOperation({ summary: 'Create a new discount' })
  @ApiBody({ type: CreateDiscountDto })
  @Post()
  async create(@Body() createDiscountDto: CreateDiscountDto) {
    return this.discountsService.create(createDiscountDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('VIEWS')
  @ApiOperation({ summary: 'Get all discounts' })
  @Get()
  async findAll(@Query() findAllDiscountDto: FindAllDiscountDto) {
    return this.discountsService.findAll(findAllDiscountDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('DETAIL')
  @ApiOperation({ summary: 'Get a specific discount by id' })
  @ApiParam({ name: 'id', type: String, description: 'Discount ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.discountsService.findOne(id);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('UPDATE')
  @ApiOperation({ summary: 'Update discount by id' })
  @ApiParam({ name: 'id', type: String, description: 'Discount ID' })
  @ApiBody({ type: UpdateDiscountDto })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDiscountDto: UpdateDiscountDto) {
    return this.discountsService.update(id, updateDiscountDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('DELETE')
  @ApiOperation({ summary: 'Delete discount by id' })
  @ApiParam({ name: 'id', type: String, description: 'Discount ID' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.discountsService.remove(id);
  }
}
