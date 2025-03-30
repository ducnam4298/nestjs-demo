export const mockBeforeConsoleAndTimers = () => {
  jest.spyOn(global, 'setInterval').mockImplementation(jest.fn());

  Object.keys(console).forEach(method => {
    const fn = console[method as keyof typeof console];
    if (typeof fn === 'function') {
      jest.spyOn(console, method as never).mockImplementation(jest.fn() as never);
    }
  });
};

export const mockAfterConsoleAndTimers = () => {
  jest.clearAllMocks();
};

export const filterServiceMock = () => ({
  getValidSortField: jest.fn().mockResolvedValue({ sortBy: 'name', sortOrder: 'asc' }),
});

export const paginationServiceMock = () => ({
  paginate: jest.fn(),
});

export const transactionMock = (ormS: Record<string, any>) => {
  return jest.fn(async <T>(fn: (db: Record<string, any>) => Promise<T>): Promise<T> => {
    return fn(ormS);
  });
};
