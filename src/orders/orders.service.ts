import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto, UpdateOrderDto, FindAllOrderDto } from './orders.dto';
import { DatabaseService } from '@/database';
import { FilterService, PaginationService, LoggerService } from '@/services';

@Injectable()
export class OrdersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly filterService: FilterService,
    private readonly paginationService: PaginationService
  ) {}
  async create(createOrderDto: CreateOrderDto) {
    return 'This action adds a new order';
  }

  async findAll(findAllOrderDto: FindAllOrderDto) {
    const { page = 1, pageRecords = 10, sortBy, sortOrder, ...filters } = findAllOrderDto;
    const model = 'order';
    LoggerService.log(
      `ℹ️ Finding orders with filters: ${JSON.stringify(filters)}, page: ${page}, pageRecords: ${pageRecords}`,
      OrdersService.name
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
    LoggerService.log(`ℹ️ Finding order with ID: ${id}`, OrdersService.name);
    const order = await this.databaseService.order.findUnique({
      where: { id },
      include: {
        items: { select: { id: true, quantity: true, price: true, discount: true } },
        user: { select: { id: true, name: true, phone: true } },
        discounts: { select: { id: true, name: true, value: true, isPercentage: true } },
      },
    });
    if (!order) {
      LoggerService.warn(`🚨 Order not found with ID: ${id}`, OrdersService.name);
      throw new NotFoundException('Order not found');
    }
    LoggerService.log(`✅ Order found: ${order.id}`, OrdersService.name);
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  async remove(id: string) {
    LoggerService.log(`ℹ️ Removing order with ID: ${id}`, OrdersService.name);
    return this.databaseService.$transaction(async db => {
      const existingOrder = await db.order.findUnique({ where: { id } });
      if (!existingOrder) {
        LoggerService.warn(`🚨 Order not found for deletion with ID: ${id}`, OrdersService.name);
        throw new NotFoundException('Order not found');
      }
      await db.order.delete({ where: { id } });
      LoggerService.log(`✅ Order removed successfully: ${id}`, OrdersService.name);
      return id;
    });
  }
}
