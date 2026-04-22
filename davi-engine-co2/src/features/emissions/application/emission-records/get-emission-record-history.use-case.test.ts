import { GetEmissionRecordHistoryUseCase } from './get-emission-record-history.use-case';
import type { EmissionRecordRepository } from '../../domain/emission-records/emission-record.repository';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { EmissionRecordHistory } from '../../domain/emission-records/emission-record-history.entity';

describe('GetEmissionRecordHistoryUseCase', () => {
    let useCase: GetEmissionRecordHistoryUseCase;
    let repo: jest.Mocked<EmissionRecordRepository>;
    let logger: jest.Mocked<ILoggerRepository>;

    beforeEach(() => {
        repo = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), audit: jest.fn(), insertHistory: jest.fn(), findHistory: jest.fn() };
        logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
        useCase = new GetEmissionRecordHistoryUseCase(repo, logger);
    });

    it('should return history for a record', async () => {
        const history: EmissionRecordHistory[] = [
            { id: 'h1', emissionRecordId: 'rec-1', action: 'created', previousStatus: null, newStatus: 'pending', changedBy: null, metadata: null, createdAt: new Date() },
        ];
        repo.findHistory.mockResolvedValue(history);

        const result = await useCase.execute('rec-1');
        expect(result).toBe(history);
        expect(repo.findHistory).toHaveBeenCalledWith('rec-1');
    });

    it('should return empty array when no history', async () => {
        repo.findHistory.mockResolvedValue([]);
        const result = await useCase.execute('rec-1');
        expect(result).toEqual([]);
    });

    it('should log before executing', async () => {
        repo.findHistory.mockResolvedValue([]);
        await useCase.execute('rec-1');
        expect(logger.info).toHaveBeenCalledWith('GetEmissionRecordHistoryUseCase.execute', { emissionRecordId: 'rec-1' });
    });
});
