import { ulid } from 'ulid';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { FuelTypeRepository, CreateFuelTypeData } from '../../domain/fuel-types/fuel-type.repository';
import type { FuelType } from '../../domain/fuel-types/fuel-type.entity';
import type { ICreateFuelTypeUseCase } from '../../domain/emissions.ports';

export class CreateFuelTypeUseCase implements ICreateFuelTypeUseCase {
    constructor(
        private readonly repo: FuelTypeRepository,
        private readonly logger: ILoggerRepository,
    ) {}

    async execute(data: Omit<CreateFuelTypeData, 'id'>): Promise<FuelType> {
        this.logger.info('CreateFuelTypeUseCase.execute', { name: data.name });
        return this.repo.create({ id: ulid(), ...data });
    }
}
