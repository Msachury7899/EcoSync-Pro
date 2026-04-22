import { GetEmissionRecordUseCase } from './get-emission-record.use-case';
import { CustomError } from '@core/util/custom-error';
import type { EmissionRecordRepository } from '../../domain/emission-records/emission-record.repository';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { EmissionRecord } from '../../domain/emission-records/emission-record.entity';

describe('GetEmissionRecordUseCase', () => {
    let useCase: GetEmissionRecordUseCase;
    let repo: jest.Mocked<EmissionRecordRepository>;
    let logger: jest.Mocked<ILoggerRepository>;

    const record: EmissionRecord = {
        id: '1', fuelTypeId: 'ft-1', quantity: 100, unit: 'kg',
        factorSnapshot: 2.5, tco2Calculated: 0.25, status: 'pending',
        recordedDate: new Date(), notes: null, createdAt: new Date(), updatedAt: new Date(),
    };

    beforeEach(() => {
        repo = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), audit: jest.fn(), insertHistory: jest.fn(), findHistory: jest.fn() };
        logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
        useCase = new GetEmissionRecordUseCase(repo, logger);
    });

    it('should return record when found', async () => {
        repo.findById.mockResolvedValue(record);
        const result = await useCase.execute('1');
        expect(result).toBe(record);
    });

    it('should throw notFound when not found', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(useCase.execute('999')).rejects.toThrow(CustomError);
    });

    it('should log before executing', async () => {
        repo.findById.mockResolvedValue(record);
        await useCase.execute('1');
        expect(logger.info).toHaveBeenCalledWith('GetEmissionRecordUseCase.execute', { id: '1' });
    });
});
