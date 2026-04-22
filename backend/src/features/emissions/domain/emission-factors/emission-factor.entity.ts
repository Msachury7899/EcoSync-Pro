export interface EmissionFactor {
    id: string;
    fuelTypeId: string;
    factorKgco2PerUnit: number;
    unit: string;
    effectiveFrom: Date;
    createdAt: Date;
}
