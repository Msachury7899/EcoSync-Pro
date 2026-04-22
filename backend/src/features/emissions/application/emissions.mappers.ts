import type { FuelType } from '../domain/fuel-types/fuel-type.entity';
import type { EmissionFactor } from '../domain/emission-factors/emission-factor.entity';
import type { EmissionRecord } from '../domain/emission-records/emission-record.entity';
import type { EmissionRecordHistory } from '../domain/emission-records/emission-record-history.entity';

export interface FuelTypeResponse {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface EmissionFactorResponse {
    id: string;
    fuelTypeId: string;
    factorKgco2PerUnit: number;
    unit: string;
    effectiveFrom: string;
    createdAt: string;
}

export interface EmissionRecordResponse {
    id: string;
    fuelTypeId: string;
    quantity: number;
    unit: string;
    factorSnapshot: number;
    tco2Calculated: number;
    status: string;
    recordedDate: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface EmissionRecordHistoryResponse {
    id: string;
    emissionRecordId: string;
    action: string;
    previousStatus: string | null;
    newStatus: string;
    changedBy: string | null;
    metadata: string | null;
    createdAt: string;
}

export function toFuelTypeResponse(fuelType: FuelType): FuelTypeResponse {
    return {
        id: fuelType.id,
        name: fuelType.name,
        description: fuelType.description,
        createdAt: fuelType.createdAt.toISOString(),
        updatedAt: fuelType.updatedAt.toISOString(),
    };
}

export function toEmissionFactorResponse(factor: EmissionFactor): EmissionFactorResponse {
    return {
        id: factor.id,
        fuelTypeId: factor.fuelTypeId,
        factorKgco2PerUnit: factor.factorKgco2PerUnit,
        unit: factor.unit,
        effectiveFrom: factor.effectiveFrom.toISOString(),
        createdAt: factor.createdAt.toISOString(),
    };
}

export function toEmissionRecordResponse(record: EmissionRecord): EmissionRecordResponse {
    return {
        id: record.id,
        fuelTypeId: record.fuelTypeId,
        quantity: record.quantity,
        unit: record.unit,
        factorSnapshot: record.factorSnapshot,
        tco2Calculated: record.tco2Calculated,
        status: record.status,
        recordedDate: record.recordedDate.toISOString(),
        notes: record.notes,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    };
}

export function toEmissionRecordHistoryResponse(history: EmissionRecordHistory): EmissionRecordHistoryResponse {
    return {
        id: history.id,
        emissionRecordId: history.emissionRecordId,
        action: history.action,
        previousStatus: history.previousStatus,
        newStatus: history.newStatus,
        changedBy: history.changedBy,
        metadata: history.metadata,
        createdAt: history.createdAt.toISOString(),
    };
}
