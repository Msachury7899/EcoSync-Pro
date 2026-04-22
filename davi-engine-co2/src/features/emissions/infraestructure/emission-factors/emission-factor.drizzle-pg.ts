import { eq, lte, desc } from 'drizzle-orm';
import { CustomError } from '@core/util/custom-error';
import type { DrizzleDb } from '@db/drizzle/client';
import { emissionFactors } from '@db/drizzle/schema';
import type { EmissionFactorRepository, CreateEmissionFactorData } from '../../domain/emission-factors/emission-factor.repository';
import type { EmissionFactor } from '../../domain/emission-factors/emission-factor.entity';

export class EmissionFactorDrizzlePg implements EmissionFactorRepository {
    constructor(private readonly db: DrizzleDb) {}

    async create(data: CreateEmissionFactorData): Promise<EmissionFactor> {
        const now = new Date();
        try {
            const [record] = await this.db
                .insert(emissionFactors)
                .values({
                    id: data.id,
                    fuelTypeId: data.fuelTypeId,
                    factorKgco2PerUnit: data.factorKgco2PerUnit,
                    unit: data.unit,
                    effectiveFrom: data.effectiveFrom,
                    createdAt: now,
                })
                .returning();
            return this.toEntity(record!);
        } catch (error) {
            if (isForeignKeyViolation(error)) throw CustomError.badRequest('El tipo de combustible indicado no existe');
            throw error;
        }
    }

    async findAll(): Promise<EmissionFactor[]> {
        const records = await this.db.select().from(emissionFactors);
        return records.map((r) => this.toEntity(r));
    }

    async findById(id: string): Promise<EmissionFactor | null> {
        const [record] = await this.db.select().from(emissionFactors).where(eq(emissionFactors.id, id));
        return record ? this.toEntity(record) : null;
    }

    async findEffectiveForDate(fuelTypeId: string, date: Date): Promise<EmissionFactor | null> {
        const [record] = await this.db
            .select()
            .from(emissionFactors)
            .where(eq(emissionFactors.fuelTypeId, fuelTypeId))
            .orderBy(desc(emissionFactors.effectiveFrom))
            .limit(1);
        if (!record || record.effectiveFrom > date) return null;
        return this.toEntity(record);
    }

    private toEntity(r: typeof emissionFactors.$inferSelect): EmissionFactor {
        return {
            id: r.id,
            fuelTypeId: r.fuelTypeId,
            factorKgco2PerUnit: r.factorKgco2PerUnit,
            unit: r.unit,
            effectiveFrom: r.effectiveFrom,
            createdAt: r.createdAt,
        };
    }
}

function isForeignKeyViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '23503';
}
