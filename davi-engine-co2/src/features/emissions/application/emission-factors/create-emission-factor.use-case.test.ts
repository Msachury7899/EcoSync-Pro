import { CreateEmissionFactorUseCase } from './create-emission-factor.use-case';
import type { EmissionFactorRepository } from '../../domain/emission-factors/emission-factor.repository';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { EmissionFactor } from '../../domain/emission-factors/emission-factor.entity';

describe('CreateEmissionFactorUseCase', () => {
    let useCase: CreateEmissionFactorUseCase;
    let repo: jest.Mocked<EmissionFactorRepository>;
    let logger: jest.Mocked<ILoggerRepository>;

    beforeEach(() => {
        repo = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), findEffectiveForDate: jest.fn() };
        logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
        useCase = new CreateEmissionFactorUseCase(repo, logger);
    });

    it('should create an emission factor with generated id', async () => {
        const input = { fuelTypeId: 'ft-1', factorKgco2PerUnit: 2.5, unit: 'kg', effectiveFrom: new Date('2025-01-01') };
        const created: EmissionFactor = { id: 'gen-id', ...input, createdAt: new Date() };
        repo.create.mockResolvedValue(created);

        const result = await useCase.execute(input);

        expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ fuelTypeId: 'ft-1', factorKgco2PerUnit: 2.5 }));
        expect(repo.create.mock.calls[0][0].id).toBeDefined();
        expect(result).toBe(created);
    });

    it('should log before creating', async () => {
        const input = { fuelTypeId: 'ft-1', factorKgco2PerUnit: 2.5, unit: 'kg', effectiveFrom: new Date() };
        repo.create.mockResolvedValue({ id: '1', ...input, createdAt: new Date() });
        await useCase.execute(input);
        expect(logger.info).toHaveBeenCalledWith('CreateEmissionFactorUseCase.execute', { fuelTypeId: 'ft-1' });
    });
});
