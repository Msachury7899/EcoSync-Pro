import { ulid } from 'ulid';
import { CustomError } from '@core/util/custom-error';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { EmissionRecordRepository } from '../../domain/emission-records/emission-record.repository';
import type { EmissionRecord } from '../../domain/emission-records/emission-record.entity';
import type { IAuditEmissionRecordUseCase } from '../../domain/emissions.ports';

export class AuditEmissionRecordUseCase implements IAuditEmissionRecordUseCase {
    constructor(
        private readonly repo: EmissionRecordRepository,
        private readonly logger: ILoggerRepository,
    ) {}

    async execute(id: string): Promise<EmissionRecord> {
        this.logger.info('AuditEmissionRecordUseCase.execute', { id });

        const existing = await this.repo.findById(id);
        if (!existing) throw CustomError.notFound('Registro de emisión no encontrado');
        if (existing.status === 'audited') throw CustomError.conflict('El registro ya ha sido auditado');

        const updated = await this.repo.audit(id);

        await this.repo.insertHistory({
            id: ulid(),
            emissionRecordId: id,
            action: 'audited',
            previousStatus: 'pending',
            newStatus: 'audited',
        });

        return updated;
    }
}
