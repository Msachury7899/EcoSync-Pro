import { CustomError } from '@core/util/custom-error';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { EmissionRecordRepository } from '../../domain/emission-records/emission-record.repository';
import type { EmissionRecord } from '../../domain/emission-records/emission-record.entity';
import type { IGetEmissionRecordUseCase } from '../../domain/emissions.ports';

export class GetEmissionRecordUseCase implements IGetEmissionRecordUseCase {
    constructor(
        private readonly repo: EmissionRecordRepository,
        private readonly logger: ILoggerRepository,
    ) {}

    async execute(id: string): Promise<EmissionRecord> {
        this.logger.info('GetEmissionRecordUseCase.execute', { id });
        const record = await this.repo.findById(id);
        if (!record) throw CustomError.notFound('Registro de emisión no encontrado');
        return record;
    }
}
