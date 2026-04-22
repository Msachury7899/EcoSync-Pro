import { eq, and, gte, lte } from 'drizzle-orm';
import { CustomError } from '@core/util/custom-error';
import type { DrizzleDb } from '@db/drizzle/client';
import { emissionRecords, emissionRecordHistory } from '@db/drizzle/schema';
import type { EmissionRecordRepository, CreateEmissionRecordData, EmissionRecordFilters, InsertHistoryData } from '../../domain/emission-records/emission-record.repository';
import type { EmissionRecord } from '../../domain/emission-records/emission-record.entity';
import type { EmissionRecordHistory } from '../../domain/emission-records/emission-record-history.entity';

export class EmissionRecordDrizzlePg implements EmissionRecordRepository {
    constructor(private readonly db: DrizzleDb) {}

    async create(data: CreateEmissionRecordData): Promise<EmissionRecord> {
        const now = new Date();
        try {
            const [record] = await this.db
                .insert(emissionRecords)
                .values({
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
                })
                .returning();
            return this.toEntity(record!);
        } catch (error) {
            if (isForeignKeyViolation(error)) throw CustomError.badRequest('El tipo de combustible indicado no existe');
            throw error;
        }
    }

    async findAll(filters?: EmissionRecordFilters): Promise<EmissionRecord[]> {
        const conditions = [];
        if (filters?.status) conditions.push(eq(emissionRecords.status, filters.status));
        if (filters?.fromDate) conditions.push(gte(emissionRecords.recordedDate, filters.fromDate));
        if (filters?.toDate) conditions.push(lte(emissionRecords.recordedDate, filters.toDate));

        const records = conditions.length > 0
            ? await this.db.select().from(emissionRecords).where(and(...conditions))
            : await this.db.select().from(emissionRecords);

        return records.map((r) => this.toEntity(r));
    }

    async findById(id: string): Promise<EmissionRecord | null> {
        const [record] = await this.db.select().from(emissionRecords).where(eq(emissionRecords.id, id));
        return record ? this.toEntity(record) : null;
    }

    async audit(id: string): Promise<EmissionRecord> {
        const now = new Date();
        const [record] = await this.db
            .update(emissionRecords)
            .set({ status: 'audited', updatedAt: now })
            .where(eq(emissionRecords.id, id))
            .returning();
        if (!record) throw CustomError.notFound('Registro de emisión no encontrado');
        return this.toEntity(record);
    }

    async insertHistory(data: InsertHistoryData): Promise<EmissionRecordHistory> {
        const [record] = await this.db
            .insert(emissionRecordHistory)
            .values({
                id: data.id,
                emissionRecordId: data.emissionRecordId,
                action: data.action,
                previousStatus: data.previousStatus,
                newStatus: data.newStatus,
                changedBy: data.changedBy ?? null,
                metadata: data.metadata ?? null,
                createdAt: new Date(),
            })
            .returning();
        return this.toHistoryEntity(record!);
    }

    async findHistory(emissionRecordId: string): Promise<EmissionRecordHistory[]> {
        const records = await this.db
            .select()
            .from(emissionRecordHistory)
            .where(eq(emissionRecordHistory.emissionRecordId, emissionRecordId));
        return records.map((r) => this.toHistoryEntity(r));
    }

    private toEntity(r: typeof emissionRecords.$inferSelect): EmissionRecord {
        return {
            id: r.id,
            fuelTypeId: r.fuelTypeId,
            quantity: r.quantity,
            unit: r.unit,
            factorSnapshot: r.factorSnapshot,
            tco2Calculated: r.tco2Calculated,
            status: r.status as 'pending' | 'audited',
            recordedDate: r.recordedDate,
            notes: r.notes,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        };
    }

    private toHistoryEntity(r: typeof emissionRecordHistory.$inferSelect): EmissionRecordHistory {
        return {
            id: r.id,
            emissionRecordId: r.emissionRecordId,
            action: r.action,
            previousStatus: r.previousStatus,
            newStatus: r.newStatus,
            changedBy: r.changedBy,
            metadata: r.metadata,
            createdAt: r.createdAt,
        };
    }
}

function isForeignKeyViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '23503';
}
