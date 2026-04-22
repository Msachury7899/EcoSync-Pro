/**
 * Helper para crear mocks tipados de repositorios sin acoplarse a jest.fn() repetitivo.
 *
 * Uso:
 *   const repo = mockOf<JobRepository>({ getAll: jest.fn().mockResolvedValue([]) });
 *   const useCase = new GetJobsUseCase(repo);
 */
export const mockOf = <T extends object>(overrides: Partial<T> = {}): jest.Mocked<T> => {
  return new Proxy(overrides as jest.Mocked<T>, {
    get: (target, prop: string) => {
      if (!(prop in target)) {
        (target as any)[prop] = jest.fn();
      }
      return (target as any)[prop];
    },
  });
};
