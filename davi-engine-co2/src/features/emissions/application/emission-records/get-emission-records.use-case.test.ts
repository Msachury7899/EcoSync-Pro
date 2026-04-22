import { GetEmissionRecordsUseCase } from './get-emission-records.use-case';
import type { EmissionRecordRepository } from '../../domain/emission-records/emission-record.repository';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';

describe('GetEmissionRecordsUseCase', () => {
    let useCase: GetEmissionRecordsUseCase;
    let repo: jest.Mocked<EmissionRecordRepository>;
    let logger: jest.Mocked<ILoggerRepository>;

    beforeEach(() => {
        repo = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), audit: jest.fn(), insertHistory: jest.fn(), findHistory: jest.fn() };
        logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
        useCase = new GetEmissionRecordsUseCase(repo, logger);
    });

    it('should return all records', async () => {
        const records = [{ id: '1', fuelTypeId: 'ft-1', quantity: 100, unit: 'kg', factorSnapshot: 2.5, tco2Calculated: 0.25, status: 'pending' as const, recordedDate: new Date(), notes: null, createdAt: new Date(), updatedAt: new Date() }];
        repo.findAll.mockResolvedValue(records);

        const result = await useCase.execute();
        expect(result).toBe(records);
    });

    it('should pass filters to repo', async () => {
        repo.findAll.mockResolvedValue([]);
        const filters = { status: 'pending' as const };
        await useCase.execute(filters);
        expect(repo.findAll).toHaveBeenCalledWith(filters);
    });

    it('should log before executing', async () => {
        repo.findAll.mockResolvedValue([]);
        await useCase.execute();
        expect(logger.info).toHaveBeenCalledWith('GetEmissionRecordsUseCase.execute', { filters: undefined });
    });
});
