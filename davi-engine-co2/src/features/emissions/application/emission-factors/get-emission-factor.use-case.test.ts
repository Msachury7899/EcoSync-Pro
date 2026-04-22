import { GetEmissionFactorUseCase } from './get-emission-factor.use-case';
import { CustomError } from '@core/util/custom-error';
import type { EmissionFactorRepository } from '../../domain/emission-factors/emission-factor.repository';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { EmissionFactor } from '../../domain/emission-factors/emission-factor.entity';

describe('GetEmissionFactorUseCase', () => {
    let useCase: GetEmissionFactorUseCase;
    let repo: jest.Mocked<EmissionFactorRepository>;
    let logger: jest.Mocked<ILoggerRepository>;

    beforeEach(() => {
        repo = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), findEffectiveForDate: jest.fn() };
        logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
        useCase = new GetEmissionFactorUseCase(repo, logger);
    });

    it('should return factor when found', async () => {
        const factor: EmissionFactor = { id: '1', fuelTypeId: 'ft-1', factorKgco2PerUnit: 2.5, unit: 'kg', effectiveFrom: new Date(), createdAt: new Date() };
        repo.findById.mockResolvedValue(factor);

        const result = await useCase.execute('1');
        expect(result).toBe(factor);
    });

    it('should throw notFound when not found', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(useCase.execute('999')).rejects.toThrow(CustomError);
    });

    it('should log before executing', async () => {
        repo.findById.mockResolvedValue({ id: '1', fuelTypeId: 'ft-1', factorKgco2PerUnit: 2.5, unit: 'kg', effectiveFrom: new Date(), createdAt: new Date() });
        await useCase.execute('1');
        expect(logger.info).toHaveBeenCalledWith('GetEmissionFactorUseCase.execute', { id: '1' });
    });
});
