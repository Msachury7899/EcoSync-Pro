export interface EmissionRecordHistory {
    id: string;
    emissionRecordId: string;
    action: string;
    previousStatus: string | null;
    newStatus: string;
    changedBy: string | null;
    metadata: string | null;
    createdAt: Date;
}
