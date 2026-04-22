import { GetFuelTypeUseCase } from './get-fuel-type.use-case';
import { CustomError } from '@core/util/custom-error';
import type { FuelTypeRepository } from '../../domain/fuel-types/fuel-type.repository';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { FuelType } from '../../domain/fuel-types/fuel-type.entity';

describe('GetFuelTypeUseCase', () => {
    let useCase: GetFuelTypeUseCase;
    let repo: jest.Mocked<FuelTypeRepository>;
    let logger: jest.Mocked<ILoggerRepository>;

    beforeEach(() => {
        repo = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn() };
        logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
        useCase = new GetFuelTypeUseCase(repo, logger);
    });

    it('should return fuel type when found', async () => {
        const fuelType: FuelType = { id: '1', name: 'Diesel', description: null, createdAt: new Date(), updatedAt: new Date() };
        repo.findById.mockResolvedValue(fuelType);

        const result = await useCase.execute('1');
        expect(result).toBe(fuelType);
        expect(repo.findById).toHaveBeenCalledWith('1');
    });

    it('should throw notFound when fuel type does not exist', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(useCase.execute('999')).rejects.toThrow(CustomError);
    });

    it('should log before executing', async () => {
        repo.findById.mockResolvedValue({ id: '1', name: 'X', description: null, createdAt: new Date(), updatedAt: new Date() });
        await useCase.execute('1');
        expect(logger.info).toHaveBeenCalledWith('GetFuelTypeUseCase.execute', { id: '1' });
    });
});
