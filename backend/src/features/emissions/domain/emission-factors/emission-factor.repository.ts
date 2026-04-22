import type { EmissionFactor } from './emission-factor.entity';

export interface CreateEmissionFactorData {
    id: string;
    fuelTypeId: string;
    factorKgco2PerUnit: number;
    unit: string;
    effectiveFrom: Date;
}

export interface EmissionFactorRepository {
    create(data: CreateEmissionFactorData): Promise<EmissionFactor>;
    findAll(): Promise<EmissionFactor[]>;
    findById(id: string): Promise<EmissionFactor | null>;
    findEffectiveForDate(fuelTypeId: string, date: Date): Promise<EmissionFactor | null>;
}
