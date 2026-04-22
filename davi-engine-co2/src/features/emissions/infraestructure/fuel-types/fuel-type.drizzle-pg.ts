import { eq } from 'drizzle-orm';
import { CustomError } from '@core/util/custom-error';
import type { DrizzleDb } from '@db/drizzle/client';
import { fuelTypes } from '@db/drizzle/schema';
import type { FuelTypeRepository, CreateFuelTypeData } from '../../domain/fuel-types/fuel-type.repository';
import type { FuelType } from '../../domain/fuel-types/fuel-type.entity';

export class FuelTypeDrizzlePg implements FuelTypeRepository {
    constructor(private readonly db: DrizzleDb) {}

    async create(data: CreateFuelTypeData): Promise<FuelType> {
        const now = new Date();
        try {
            const [record] = await this.db
                .insert(fuelTypes)
                .values({ id: data.id, name: data.name, description: data.description ?? null, createdAt: now, updatedAt: now })
                .returning();
            return this.toEntity(record!);
        } catch (error) {
            if (isUniqueViolation(error)) throw CustomError.conflict('Ya existe un tipo de combustible con ese nombre');
            throw error;
        }
    }

    async findAll(): Promise<FuelType[]> {
        const records = await this.db.select().from(fuelTypes);
        return records.map((r) => this.toEntity(r));
    }

    async findById(id: string): Promise<FuelType | null> {
        const [record] = await this.db.select().from(fuelTypes).where(eq(fuelTypes.id, id));
        return record ? this.toEntity(record) : null;
    }

    private toEntity(r: typeof fuelTypes.$inferSelect): FuelType {
        return { id: r.id, name: r.name, description: r.description, createdAt: r.createdAt, updatedAt: r.updatedAt };
    }
}

function isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === '23505';
}
