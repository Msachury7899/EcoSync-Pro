import type { FuelType } from './fuel-type.entity';

export interface CreateFuelTypeData {
    id: string;
    name: string;
    description?: string;
}

export interface FuelTypeRepository {
    create(data: CreateFuelTypeData): Promise<FuelType>;
    findAll(): Promise<FuelType[]>;
    findById(id: string): Promise<FuelType | null>;
}
