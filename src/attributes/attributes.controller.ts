import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { AttributesService } from './attributes.service';
import { CreateAttributeDto, FindAllAttributeDto, UpdateAttributeDto } from './attributes.dto';
import { ApiController, Metadata } from '@/access_control';

@ApiController('Attributes', FindAllAttributeDto)
@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('CREATE')
  @ApiOperation({ summary: 'Create a new attribute' })
  @ApiBody({ type: CreateAttributeDto })
  @Post()
  async create(@Body() createAttributeDto: CreateAttributeDto) {
    return this.attributesService.create(createAttributeDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('VIEWS')
  @ApiOperation({ summary: 'Get all attributes' })
  @Get()
  findAll(@Query() findAllAttributeDto: FindAllAttributeDto) {
    return this.attributesService.findAll(findAllAttributeDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('DETAIL')
  @ApiOperation({ summary: 'Get a specific attribute by id' })
  @ApiParam({ name: 'id', type: String, description: 'Attribute ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.attributesService.findOne(id);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('UPDATE')
  @ApiOperation({ summary: 'Update attribute by id' })
  @ApiParam({ name: 'id', type: String, description: 'Attribute ID' })
  @ApiBody({ type: UpdateAttributeDto })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAttributeDto: UpdateAttributeDto) {
    return this.attributesService.update(id, updateAttributeDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('DELETE')
  @ApiOperation({ summary: 'Delete attribute by id' })
  @ApiParam({ name: 'id', type: String, description: 'Attribute ID' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.attributesService.remove(id);
  }
}
