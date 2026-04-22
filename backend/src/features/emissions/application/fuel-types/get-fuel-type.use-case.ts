import { CustomError } from '@core/util/custom-error';
import type { ILoggerRepository } from '@core/interfaces/logger.repository';
import type { FuelTypeRepository } from '../../domain/fuel-types/fuel-type.repository';
import type { FuelType } from '../../domain/fuel-types/fuel-type.entity';
import type { IGetFuelTypeUseCase } from '../../domain/emissions.ports';

export class GetFuelTypeUseCase implements IGetFuelTypeUseCase {
    constructor(
        private readonly repo: FuelTypeRepository,
        private readonly logger: ILoggerRepository,
    ) {}

    async execute(id: string): Promise<FuelType> {
        this.logger.info('GetFuelTypeUseCase.execute', { id });
        const fuelType = await this.repo.findById(id);
        if (!fuelType) throw CustomError.notFound('Tipo de combustible no encontrado');
        return fuelType;
    }
}
