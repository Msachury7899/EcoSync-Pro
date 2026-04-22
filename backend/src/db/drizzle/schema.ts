import {
    pgTable,
    text,
    timestamp,
    real,
    integer,
    boolean,
    primaryKey,
    unique,
    smallint,
} from 'drizzle-orm/pg-core';

export const fuelTypes = pgTable('fuel_types', {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
});

export const emissionFactors = pgTable('emission_factors', {
    id: text('id').primaryKey(),
    fuelTypeId: text('fuel_type_id').notNull().references(() => fuelTypes.id),
    factorKgco2PerUnit: real('factor_kgco2_per_unit').notNull(),
    unit: text('unit').notNull(),
    effectiveFrom: timestamp('effective_from').notNull(),
    createdAt: timestamp('created_at').notNull(),
});

export const plants = pgTable('plants', {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    location: text('location'),
    monthlyLimitTco2: real('monthly_limit_tco2').notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
});

export const emissionRecords = pgTable('emission_records', {
    id: text('id').primaryKey(),
    fuelTypeId: text('fuel_type_id').notNull().references(() => fuelTypes.id),
    quantity: real('quantity').notNull(),
    unit: text('unit').notNull(),
    factorSnapshot: real('factor_snapshot').notNull(),
    tco2Calculated: real('tco2_calculated').notNull(),
    status: text('status').notNull().default('pending'),
    recordedDate: timestamp('recorded_date').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
});

export const emissionRecordHistory = pgTable('emission_record_history', {
    id: text('id').primaryKey(),
    emissionRecordId: text('emission_record_id').notNull().references(() => emissionRecords.id),
    action: text('action').notNull(),
    previousStatus: text('previous_status'),
    newStatus: text('new_status').notNull(),
    changedBy: text('changed_by'),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').notNull(),
});
