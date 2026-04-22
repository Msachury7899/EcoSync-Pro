import { CreateEmissionRecordUseCase } from './create-emission-record.use-case';
import { CustomError } from '@core/util/custom-error';
import type { EmissionRecordRepository } from '../../domain/emission-records/emission-record.repository';
import type { EmissionFactorRepository } from '../../domain/emission-factors/emission-factor.repository';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { EmissionRecord } from '../../domain/emission-records/emission-record.entity';
import type { EmissionFactor } from '../../domain/emission-factors/emission-factor.entity';
import type { EmissionRecordHistory } from '../../domain/emission-records/emission-record-history.entity';

describe('CreateEmissionRecordUseCase', () => {
    let useCase: CreateEmissionRecordUseCase;
    let repo: jest.Mocked<EmissionRecordRepository>;
    let factorRepo: jest.Mocked<EmissionFactorRepository>;
    let logger: jest.Mocked<ILoggerRepository>;

    const factor: EmissionFactor = {
        id: 'f1', fuelTypeId: 'ft-1', factorKgco2PerUnit: 2.5, unit: 'kg',
        effectiveFrom: new Date('2025-01-01'), createdAt: new Date(),
    };

    const record: EmissionRecord = {
        id: 'rec-1', fuelTypeId: 'ft-1', quantity: 1000, unit: 'kg',
        factorSnapshot: 2.5, tco2Calculated: 2.5, status: 'pending',
        recordedDate: new Date('2025-06-15'), notes: null,
        createdAt: new Date(), updatedAt: new Date(),
    };

    const history: EmissionRecordHistory = {
        id: 'h1', emissionRecordId: 'rec-1', action: 'created',
        previousStatus: null, newStatus: 'pending', changedBy: null, metadata: null,
        createdAt: new Date(),
    };

    beforeEach(() => {
        repo = {
            create: jest.fn().mockResolvedValue(record),
            findAll: jest.fn(), findById: jest.fn(), audit: jest.fn(),
            insertHistory: jest.fn().mockResolvedValue(history),
            findHistory: jest.fn(),
        };
        factorRepo = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), findEffectiveForDate: jest.fn() };
        logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
        useCase = new CreateEmissionRecordUseCase(repo, factorRepo, logger);
    });

    it('should calculate tco2 as (quantity * factor) / 1000', async () => {
        factorRepo.findEffectiveForDate.mockResolvedValue(factor);

        const input = { fuelTypeId: 'ft-1', quantity: 1000, unit: 'kg', recordedDate: new Date('2025-06-15') };
        await useCase.execute(input);

        expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
            factorSnapshot: 2.5,
            tco2Calculated: 2.5, // (1000 * 2.5) / 1000
        }));
    });

    it('should throw badRequest when no effective factor found', async () => {
        factorRepo.findEffectiveForDate.mockResolvedValue(null);

        const input = { fuelTypeId: 'ft-1', quantity: 1000, unit: 'kg', recordedDate: new Date('2025-06-15') };
        await expect(useCase.execute(input)).rejects.toThrow(CustomError);
    });

    it('should insert history after creation', async () => {
        factorRepo.findEffectiveForDate.mockResolvedValue(factor);

        const input = { fuelTypeId: 'ft-1', quantity: 500, unit: 'kg', recordedDate: new Date('2025-06-15') };
        await useCase.execute(input);

        expect(repo.insertHistory).toHaveBeenCalledWith(expect.objectContaining({
            emissionRecordId: 'rec-1',
            action: 'created',
            previousStatus: null,
            newStatus: 'pending',
        }));
    });

    it('should return the created record', async () => {
        factorRepo.findEffectiveForDate.mockResolvedValue(factor);

        const input = { fuelTypeId: 'ft-1', quantity: 500, unit: 'kg', recordedDate: new Date('2025-06-15') };
        const result = await useCase.execute(input);
        expect(result).toBe(record);
    });

    it('should log before executing', async () => {
        factorRepo.findEffectiveForDate.mockResolvedValue(factor);
        const input = { fuelTypeId: 'ft-1', quantity: 500, unit: 'kg', recordedDate: new Date('2025-06-15') };
        await useCase.execute(input);
        expect(logger.info).toHaveBeenCalledWith('CreateEmissionRecordUseCase.execute', { fuelTypeId: 'ft-1' });
    });
});
