import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { FuelTypeRepository } from '../../domain/fuel-types/fuel-type.repository';
import type { FuelType } from '../../domain/fuel-types/fuel-type.entity';
import type { IGetFuelTypesUseCase } from '../../domain/emissions.ports';

export class GetFuelTypesUseCase implements IGetFuelTypesUseCase {
    constructor(
        private readonly repo: FuelTypeRepository,
        private readonly logger: ILoggerRepository,
    ) {}

    async execute(): Promise<FuelType[]> {
        this.logger.info('GetFuelTypesUseCase.execute');
        return this.repo.findAll();
    }
}
