import { GetFuelTypesUseCase } from './get-fuel-types.use-case';
import type { FuelTypeRepository } from '../../domain/fuel-types/fuel-type.repository';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { FuelType } from '../../domain/fuel-types/fuel-type.entity';

describe('GetFuelTypesUseCase', () => {
    let useCase: GetFuelTypesUseCase;
    let repo: jest.Mocked<FuelTypeRepository>;
    let logger: jest.Mocked<ILoggerRepository>;

    beforeEach(() => {
        repo = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn() };
        logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
        useCase = new GetFuelTypesUseCase(repo, logger);
    });

    it('should return all fuel types', async () => {
        const items: FuelType[] = [
            { id: '1', name: 'Diesel', description: null, createdAt: new Date(), updatedAt: new Date() },
            { id: '2', name: 'Gas', description: 'Natural gas', createdAt: new Date(), updatedAt: new Date() },
        ];
        repo.findAll.mockResolvedValue(items);

        const result = await useCase.execute();
        expect(result).toBe(items);
        expect(repo.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no fuel types', async () => {
        repo.findAll.mockResolvedValue([]);
        const result = await useCase.execute();
        expect(result).toEqual([]);
    });

    it('should log before executing', async () => {
        repo.findAll.mockResolvedValue([]);
        await useCase.execute();
        expect(logger.info).toHaveBeenCalledWith('GetFuelTypesUseCase.execute');
    });
});
