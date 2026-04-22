import { CustomError } from '@core/util/custom-error';
import type { FuelTypeRepository, CreateFuelTypeData } from '../../domain/fuel-types/fuel-type.repository';
import type { FuelType } from '../../domain/fuel-types/fuel-type.entity';

export class FuelTypeVanillaMemory implements FuelTypeRepository {
    private items: FuelType[] = [];

    async create(data: CreateFuelTypeData): Promise<FuelType> {
        if (this.items.some((i) => i.name === data.name)) throw CustomError.conflict('Ya existe un tipo de combustible con ese nombre');
        const now = new Date();
        const item: FuelType = { id: data.id, name: data.name, description: data.description ?? null, createdAt: now, updatedAt: now };
        this.items.push(item);
        return item;
    }

    async findAll(): Promise<FuelType[]> {
        return [...this.items];
    }

    async findById(id: string): Promise<FuelType | null> {
        return this.items.find((i) => i.id === id) ?? null;
    }
}
