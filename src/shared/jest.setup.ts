/* eslint-disable @typescript-eslint/no-unsafe-return */
jest.mock('@/shared', () => {
  const actualModule = jest.requireActual('@/shared');

  return {
    ...actualModule,
    retryTransaction: jest
      .fn()
      .mockImplementation(async <T>(fn: () => Promise<T>): Promise<T> => await fn()),
    getModelDelegate: jest.fn(),
    buildWhereClause: jest.fn(),
  };
});
