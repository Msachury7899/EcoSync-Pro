import { CustomError } from '@core/util/custom-error';
import type { EmissionRecordRepository, CreateEmissionRecordData, EmissionRecordFilters, InsertHistoryData } from '../../domain/emission-records/emission-record.repository';
import type { EmissionRecord } from '../../domain/emission-records/emission-record.entity';
import type { EmissionRecordHistory } from '../../domain/emission-records/emission-record-history.entity';

export class EmissionRecordVanillaMemory implements EmissionRecordRepository {
    private items: EmissionRecord[] = [];
    private history: EmissionRecordHistory[] = [];

    async create(data: CreateEmissionRecordData): Promise<EmissionRecord> {
        const now = new Date();
        const item: EmissionRecord = {
            id: data.id,
            fuelTypeId: data.fuelTypeId,
            quantity: data.quantity,
            unit: data.unit,
            factorSnapshot: data.factorSnapshot,
            tco2Calculated: data.tco2Calculated,
            status: 'pending',
            recordedDate: data.recordedDate,
            notes: data.notes ?? null,
            createdAt: now,
            updatedAt: now,
        };
        this.items.push(item);
        return item;
    }

    async findAll(filters?: EmissionRecordFilters): Promise<EmissionRecord[]> {
        return this.items.filter((i) => {
            if (filters?.status && i.status !== filters.status) return false;
            if (filters?.fromDate && i.recordedDate < filters.fromDate) return false;
            if (filters?.toDate && i.recordedDate > filters.toDate) return false;
            return true;
        });
    }

    async findById(id: string): Promise<EmissionRecord | null> {
        return this.items.find((i) => i.id === id) ?? null;
    }

    async audit(id: string): Promise<EmissionRecord> {
        const idx = this.items.findIndex((i) => i.id === id);
        if (idx === -1) throw CustomError.notFound('Registro de emisión no encontrado');
        this.items[idx] = { ...this.items[idx]!, status: 'audited', updatedAt: new Date() };
        return this.items[idx]!;
    }

    async insertHistory(data: InsertHistoryData): Promise<EmissionRecordHistory> {
        const entry: EmissionRecordHistory = {
            id: data.id,
            emissionRecordId: data.emissionRecordId,
            action: data.action,
            previousStatus: data.previousStatus,
            newStatus: data.newStatus,
            changedBy: data.changedBy ?? null,
            metadata: data.metadata ?? null,
            createdAt: new Date(),
        };
        this.history.push(entry);
        return entry;
    }

    async findHistory(emissionRecordId: string): Promise<EmissionRecordHistory[]> {
        return this.history
            .filter((h) => h.emissionRecordId === emissionRecordId)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }
}
