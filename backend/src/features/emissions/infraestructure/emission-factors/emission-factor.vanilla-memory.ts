import type { EmissionFactorRepository, CreateEmissionFactorData } from '../../domain/emission-factors/emission-factor.repository';
import type { EmissionFactor } from '../../domain/emission-factors/emission-factor.entity';

export class EmissionFactorVanillaMemory implements EmissionFactorRepository {
    private items: EmissionFactor[] = [];

    async create(data: CreateEmissionFactorData): Promise<EmissionFactor> {
        const item: EmissionFactor = { ...data, createdAt: new Date() };
        this.items.push(item);
        return item;
    }

    async findAll(): Promise<EmissionFactor[]> {
        return [...this.items];
    }

    async findById(id: string): Promise<EmissionFactor | null> {
        return this.items.find((i) => i.id === id) ?? null;
    }

    async findEffectiveForDate(fuelTypeId: string, date: Date): Promise<EmissionFactor | null> {
        const candidates = this.items
            .filter((i) => i.fuelTypeId === fuelTypeId && i.effectiveFrom <= date)
            .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());
        return candidates[0] ?? null;
    }
}
