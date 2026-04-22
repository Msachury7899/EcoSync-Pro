import { AuditEmissionRecordUseCase } from './audit-emission-record.use-case';
import { CustomError } from '@core/util/custom-error';
import type { EmissionRecordRepository } from '../../domain/emission-records/emission-record.repository';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { EmissionRecord } from '../../domain/emission-records/emission-record.entity';

describe('AuditEmissionRecordUseCase', () => {
    let useCase: AuditEmissionRecordUseCase;
    let repo: jest.Mocked<EmissionRecordRepository>;
    let logger: jest.Mocked<ILoggerRepository>;

    const pendingRecord: EmissionRecord = {
        id: '1', fuelTypeId: 'ft-1', quantity: 100, unit: 'kg',
        factorSnapshot: 2.5, tco2Calculated: 0.25, status: 'pending',
        recordedDate: new Date(), notes: null, createdAt: new Date(), updatedAt: new Date(),
    };

    const auditedRecord: EmissionRecord = { ...pendingRecord, status: 'audited' };

    beforeEach(() => {
        repo = { create: jest.fn(), findAll: jest.fn(), findById: jest.fn(), audit: jest.fn(), insertHistory: jest.fn(), findHistory: jest.fn() };
        logger = { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };
        useCase = new AuditEmissionRecordUseCase(repo, logger);
    });

    it('should audit a pending record', async () => {
        repo.findById.mockResolvedValue(pendingRecord);
        repo.audit.mockResolvedValue(auditedRecord);
        repo.insertHistory.mockResolvedValue({} as any);

        const result = await useCase.execute('1');
        expect(result).toBe(auditedRecord);
        expect(repo.audit).toHaveBeenCalledWith('1');
    });

    it('should throw notFound when record does not exist', async () => {
        repo.findById.mockResolvedValue(null);
        await expect(useCase.execute('999')).rejects.toThrow(CustomError);
    });

    it('should throw conflict when already audited', async () => {
        repo.findById.mockResolvedValue(auditedRecord);
        await expect(useCase.execute('1')).rejects.toThrow(CustomError);
    });

    it('should insert history after auditing', async () => {
        repo.findById.mockResolvedValue(pendingRecord);
        repo.audit.mockResolvedValue(auditedRecord);
        repo.insertHistory.mockResolvedValue({} as any);

        await useCase.execute('1');
        expect(repo.insertHistory).toHaveBeenCalledWith(expect.objectContaining({
            emissionRecordId: '1',
            action: 'audited',
            previousStatus: 'pending',
            newStatus: 'audited',
        }));
    });

    it('should log before executing', async () => {
        repo.findById.mockResolvedValue(pendingRecord);
        repo.audit.mockResolvedValue(auditedRecord);
        repo.insertHistory.mockResolvedValue({} as any);

        await useCase.execute('1');
        expect(logger.info).toHaveBeenCalledWith('AuditEmissionRecordUseCase.execute', { id: '1' });
    });
});
