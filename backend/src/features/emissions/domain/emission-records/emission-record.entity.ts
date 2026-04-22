export type EmissionRecordStatus = 'pending' | 'audited';

export interface EmissionRecord {
    id: string;
    fuelTypeId: string;
    quantity: number;
    unit: string;
    factorSnapshot: number;
    tco2Calculated: number;
    status: EmissionRecordStatus;
    recordedDate: Date;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}
