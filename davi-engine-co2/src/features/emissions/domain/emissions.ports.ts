import type { FuelType } from './fuel-types/fuel-type.entity';
import type { EmissionFactor } from './emission-factors/emission-factor.entity';
import type { EmissionRecord } from './emission-records/emission-record.entity';
import type { EmissionRecordHistory } from './emission-records/emission-record-history.entity';
import type { CreateFuelTypeData } from './fuel-types/fuel-type.repository';
import type { CreateEmissionFactorData } from './emission-factors/emission-factor.repository';
import type { CreateEmissionRecordData, EmissionRecordFilters } from './emission-records/emission-record.repository';

export interface ICreateFuelTypeUseCase {
    execute(data: Omit<CreateFuelTypeData, 'id'>): Promise<FuelType>;
}

export interface IGetFuelTypesUseCase {
    execute(): Promise<FuelType[]>;
}

export interface IGetFuelTypeUseCase {
    execute(id: string): Promise<FuelType>;
}

export interface ICreateEmissionFactorUseCase {
    execute(data: Omit<CreateEmissionFactorData, 'id'>): Promise<EmissionFactor>;
}

export interface IGetEmissionFactorsUseCase {
    execute(): Promise<EmissionFactor[]>;
}

export interface IGetEmissionFactorUseCase {
    execute(id: string): Promise<EmissionFactor>;
}

export interface ICreateEmissionRecordUseCase {
    execute(data: Omit<CreateEmissionRecordData, 'id' | 'factorSnapshot' | 'tco2Calculated'>): Promise<EmissionRecord>;
}

export interface IGetEmissionRecordsUseCase {
    execute(filters?: EmissionRecordFilters): Promise<EmissionRecord[]>;
}

export interface IGetEmissionRecordUseCase {
    execute(id: string): Promise<EmissionRecord>;
}

export interface IAuditEmissionRecordUseCase {
    execute(id: string): Promise<EmissionRecord>;
}

export interface IGetEmissionRecordHistoryUseCase {
    execute(emissionRecordId: string): Promise<EmissionRecordHistory[]>;
}
