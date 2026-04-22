import { GetEmissionFactorsUseCase } from './get-emission-factors.use-case';
import type { EmissionFactorRepository } from '../../domain/emission-factors/emission-factor.repository';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';

describe('GetEmissionFactorsUseCase', () => {
    let useCase: GetEmissionFactorsUseCase;
    let repo: jest.Mocked<EmissionFactorRepository>;
    let logger: jest.Mocked<ILoggerRepository>;

    beforeEach(() => {
        repo = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), findEffectiveForDate: jest.fn() };
        logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
        useCase = new GetEmissionFactorsUseCase(repo, logger);
    });

    it('should return all emission factors', async () => {
        const items = [{ id: '1', fuelTypeId: 'ft-1', factorKgco2PerUnit: 2.5, unit: 'kg', effectiveFrom: new Date(), createdAt: new Date() }];
        repo.findAll.mockResolvedValue(items);

        const result = await useCase.execute();
        expect(result).toBe(items);
    });

    it('should return empty array', async () => {
        repo.findAll.mockResolvedValue([]);
        const result = await useCase.execute();
        expect(result).toEqual([]);
    });

    it('should log before executing', async () => {
        repo.findAll.mockResolvedValue([]);
        await useCase.execute();
        expect(logger.info).toHaveBeenCalledWith('GetEmissionFactorsUseCase.execute');
    });
});
