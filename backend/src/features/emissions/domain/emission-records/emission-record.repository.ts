import type { EmissionRecord, EmissionRecordStatus } from './emission-record.entity';
import type { EmissionRecordHistory } from './emission-record-history.entity';

export interface CreateEmissionRecordData {
    id: string;
    fuelTypeId: string;
    quantity: number;
    unit: string;
    factorSnapshot: number;
    tco2Calculated: number;
    recordedDate: Date;
    notes?: string;
}

export interface EmissionRecordFilters {
    status?: EmissionRecordStatus;
    fromDate?: Date;
    toDate?: Date;
}

export interface InsertHistoryData {
    id: string;
    emissionRecordId: string;
    action: string;
    previousStatus: string | null;
    newStatus: string;
    changedBy?: string;
    metadata?: string;
}

export interface EmissionRecordRepository {
    create(data: CreateEmissionRecordData): Promise<EmissionRecord>;
    findAll(filters?: EmissionRecordFilters): Promise<EmissionRecord[]>;
    findById(id: string): Promise<EmissionRecord | null>;
    audit(id: string): Promise<EmissionRecord>;
    insertHistory(data: InsertHistoryData): Promise<EmissionRecordHistory>;
    findHistory(emissionRecordId: string): Promise<EmissionRecordHistory[]>;
}
