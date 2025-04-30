import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, FindAllOrderDto, UpdateOrderDto } from './orders.dto';
import { ApiController, Metadata } from '@/access_control';

@ApiController('Orders', FindAllOrderDto)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('CREATE')
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('VIEWS')
  @ApiOperation({ summary: 'Get all orders' })
  @Get()
  async findAll(@Query() findAllOrderDto: FindAllOrderDto) {
    return this.ordersService.findAll(findAllOrderDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('DETAIL')
  @ApiOperation({ summary: 'Get a specific order by id' })
  @ApiParam({ name: 'id', type: String, description: 'Order ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('UPDATE')
  @ApiOperation({ summary: 'Update order by id' })
  @ApiParam({ name: 'id', type: String, description: 'Order ID' })
  @ApiBody({ type: UpdateOrderDto })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }
  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('DELETE')
  @ApiOperation({ summary: 'Delete order by id' })
  @ApiParam({ name: 'id', type: String, description: 'Order ID' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
