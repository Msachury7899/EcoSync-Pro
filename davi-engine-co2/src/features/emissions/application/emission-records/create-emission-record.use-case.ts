import { ulid } from 'ulid';
import { CustomError } from '@core/util/custom-error';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { EmissionRecordRepository, CreateEmissionRecordData } from '../../domain/emission-records/emission-record.repository';
import type { EmissionFactorRepository } from '../../domain/emission-factors/emission-factor.repository';
import type { EmissionRecord } from '../../domain/emission-records/emission-record.entity';
import type { ICreateEmissionRecordUseCase } from '../../domain/emissions.ports';

type CreateInput = Omit<CreateEmissionRecordData, 'id' | 'factorSnapshot' | 'tco2Calculated'>;

export class CreateEmissionRecordUseCase implements ICreateEmissionRecordUseCase {
    constructor(
        private readonly repo: EmissionRecordRepository,
        private readonly factorRepo: EmissionFactorRepository,
        private readonly logger: ILoggerRepository,
    ) {}

    async execute(data: CreateInput): Promise<EmissionRecord> {
        this.logger.info('CreateEmissionRecordUseCase.execute', { fuelTypeId: data.fuelTypeId });

        const factor = await this.factorRepo.findEffectiveForDate(data.fuelTypeId, data.recordedDate);
        if (!factor) throw CustomError.badRequest('No hay factor de conversión vigente para este combustible en la fecha indicada');

        const tco2Calculated = (data.quantity * factor.factorKgco2PerUnit) / 1000;

        const record = await this.repo.create({
            id: ulid(),
            ...data,
            factorSnapshot: factor.factorKgco2PerUnit,
            tco2Calculated,
        });

        await this.repo.insertHistory({
            id: ulid(),
            emissionRecordId: record.id,
            action: 'created',
            previousStatus: null,
            newStatus: 'pending',
        });

        return record;
    }
}
