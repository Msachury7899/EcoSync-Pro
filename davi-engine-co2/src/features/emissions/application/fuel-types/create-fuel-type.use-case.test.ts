import { CreateFuelTypeUseCase } from './create-fuel-type.use-case';
import type { FuelTypeRepository } from '../../domain/fuel-types/fuel-type.repository';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { FuelType } from '../../domain/fuel-types/fuel-type.entity';

describe('CreateFuelTypeUseCase', () => {
    let useCase: CreateFuelTypeUseCase;
    let repo: jest.Mocked<FuelTypeRepository>;
    let logger: jest.Mocked<ILoggerRepository>;

    beforeEach(() => {
        repo = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn() };
        logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
        useCase = new CreateFuelTypeUseCase(repo, logger);
    });

    it('should create a fuel type with generated id', async () => {
        const input = { name: 'Diesel', description: 'Diesel fuel' };
        const created: FuelType = { id: 'generated-id', name: 'Diesel', description: 'Diesel fuel', createdAt: new Date(), updatedAt: new Date() };
        repo.create.mockResolvedValue(created);

        const result = await useCase.execute(input);

        expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Diesel', description: 'Diesel fuel' }));
        expect(repo.create.mock.calls[0][0].id).toBeDefined();
        expect(result).toBe(created);
    });

    it('should log before creating', async () => {
        repo.create.mockResolvedValue({ id: '1', name: 'Gas', description: null, createdAt: new Date(), updatedAt: new Date() });
        await useCase.execute({ name: 'Gas' });
        expect(logger.info).toHaveBeenCalledWith('CreateFuelTypeUseCase.execute', { name: 'Gas' });
    });
});
