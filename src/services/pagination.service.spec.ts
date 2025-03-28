import { Test, TestingModule } from '@nestjs/testing';
import { PaginationService } from '@/services';
import { DatabaseService } from '@/database';
import {
  getModelDelegate,
  buildWhereClause,
  PaginationResponseDto,
  mockBeforeConsoleAndTimers,
  mockAfterConsoleAndTimers,
} from '@/shared';
import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

describe('PaginationService', () => {
  let paginationService: PaginationService;

  const modelName = 'user' as keyof PrismaClient;
  const filters = { name: 'test' };
  const page = 1;
  const pageRecords = 10;
  const sortBy = 'name';
  const sortOrder = 'asc';
  const mockWhereClause = { name: { contains: 'test' } };

  const mockData = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
  ];
  const totalRecord = mockData.length;

  const mockDatabaseService = {
    user: { findMany: jest.fn(), count: jest.fn() },
  };

  const setupMocks = () => {
    (getModelDelegate as unknown as jest.Mock).mockReturnValue(mockDatabaseService.user);
    (buildWhereClause as jest.Mock).mockReturnValue(mockWhereClause);
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaginationService, { provide: DatabaseService, useValue: mockDatabaseService }],
    }).compile();

    paginationService = module.get<PaginationService>(PaginationService);

    setupMocks();

    mockBeforeConsoleAndTimers();
  });

  afterEach(() => {
    mockAfterConsoleAndTimers();
  });

  describe('paginate', () => {
    it('should return paginated data', async () => {
      mockDatabaseService.user.findMany.mockResolvedValue(mockData);
      mockDatabaseService.user.count.mockResolvedValue(totalRecord);

      const result = await paginationService.paginate(
        modelName,
        filters,
        page,
        pageRecords,
        sortBy,
        sortOrder
      );

      expect(result).toEqual(new PaginationResponseDto(mockData, totalRecord, page, pageRecords));
      expect(getModelDelegate).toHaveBeenCalledWith(modelName, mockDatabaseService);
      expect(buildWhereClause).toHaveBeenCalledWith(filters);
      expect(mockDatabaseService.user.findMany).toHaveBeenCalledWith({
        where: mockWhereClause,
        skip: 0,
        take: pageRecords,
        orderBy: { [sortBy]: sortOrder },
      });
      expect(mockDatabaseService.user.count).toHaveBeenCalledWith({ where: mockWhereClause });
    });

    it('should return empty data when no records found', async () => {
      mockDatabaseService.user.findMany.mockResolvedValue([]);
      mockDatabaseService.user.count.mockResolvedValue(0);

      const result = await paginationService.paginate(
        modelName,
        filters,
        page,
        pageRecords,
        sortBy,
        sortOrder
      );

      expect(result).toEqual(new PaginationResponseDto([], 0, page, pageRecords));
    });

    it('should throw NotFoundException if model does not exist', async () => {
      (getModelDelegate as unknown as jest.Mock).mockReturnValue(null);

      await expect(
        paginationService.paginate(modelName, filters, page, pageRecords, sortBy, sortOrder)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
