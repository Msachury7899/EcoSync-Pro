import { z } from 'zod';

const CreateFuelTypeDto = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    description: z.string().optional(),
});

const FuelTypeIdDto = z.object({
    id: z.string().min(1, 'El ID es obligatorio'),
});

const CreateEmissionFactorDto = z.object({
    fuelTypeId: z.string().min(1, 'El tipo de combustible es obligatorio'),
    factorKgco2PerUnit: z.number().positive('El factor debe ser positivo'),
    unit: z.string().min(1, 'La unidad es obligatoria'),
    effectiveFrom: z.string().datetime('Fecha de vigencia inválida'),
});

const EmissionFactorIdDto = z.object({
    id: z.string().min(1, 'El ID es obligatorio'),
});

const CreateEmissionRecordDto = z.object({
    fuelTypeId: z.string().min(1, 'El tipo de combustible es obligatorio'),
    quantity: z.number().positive('La cantidad debe ser positiva'),
    unit: z.string().min(1, 'La unidad es obligatoria'),
    recordedDate: z.string().datetime('Fecha de registro inválida'),
    notes: z.string().optional(),
});

const EmissionRecordIdDto = z.object({
    id: z.string().min(1, 'El ID es obligatorio'),
});

const EmissionRecordFiltersDto = z.object({
    status: z.enum(['pending', 'audited']).optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
});

export const schemaMapEmissions = {
    CreateFuelTypeDto,
    FuelTypeIdDto,
    CreateEmissionFactorDto,
    EmissionFactorIdDto,
    CreateEmissionRecordDto,
    EmissionRecordIdDto,
    EmissionRecordFiltersDto,
};

export type EmissionsValidatorSchemaMap = typeof schemaMapEmissions;
