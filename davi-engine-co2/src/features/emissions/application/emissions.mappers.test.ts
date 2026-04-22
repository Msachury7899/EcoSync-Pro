import {
    toFuelTypeResponse,
    toEmissionFactorResponse,
    toEmissionRecordResponse,
    toEmissionRecordHistoryResponse,
} from './emissions.mappers';
import type { FuelType } from '../domain/fuel-types/fuel-type.entity';
import type { EmissionFactor } from '../domain/emission-factors/emission-factor.entity';
import type { EmissionRecord } from '../domain/emission-records/emission-record.entity';
import type { EmissionRecordHistory } from '../domain/emission-records/emission-record-history.entity';

describe('emissions.mappers', () => {
    const now = new Date('2025-06-15T10:00:00.000Z');

    describe('toFuelTypeResponse', () => {
        it('should map FuelType to response with ISO dates', () => {
            const ft: FuelType = { id: '1', name: 'Diesel', description: 'Desc', createdAt: now, updatedAt: now };
            const result = toFuelTypeResponse(ft);
            expect(result).toEqual({
                id: '1', name: 'Diesel', description: 'Desc',
                createdAt: '2025-06-15T10:00:00.000Z', updatedAt: '2025-06-15T10:00:00.000Z',
            });
        });

        it('should handle null description', () => {
            const ft: FuelType = { id: '1', name: 'Gas', description: null, createdAt: now, updatedAt: now };
            expect(toFuelTypeResponse(ft).description).toBeNull();
        });
    });

    describe('toEmissionFactorResponse', () => {
        it('should map EmissionFactor to response', () => {
            const ef: EmissionFactor = { id: '1', fuelTypeId: 'ft-1', factorKgco2PerUnit: 2.5, unit: 'kg', effectiveFrom: now, createdAt: now };
            const result = toEmissionFactorResponse(ef);
            expect(result).toEqual({
                id: '1', fuelTypeId: 'ft-1', factorKgco2PerUnit: 2.5, unit: 'kg',
                effectiveFrom: '2025-06-15T10:00:00.000Z', createdAt: '2025-06-15T10:00:00.000Z',
            });
        });
    });

    describe('toEmissionRecordResponse', () => {
        it('should map EmissionRecord to response', () => {
            const rec: EmissionRecord = {
                id: '1', fuelTypeId: 'ft-1', quantity: 100, unit: 'kg',
                factorSnapshot: 2.5, tco2Calculated: 0.25, status: 'pending',
                recordedDate: now, notes: 'test', createdAt: now, updatedAt: now,
            };
            const result = toEmissionRecordResponse(rec);
            expect(result.id).toBe('1');
            expect(result.tco2Calculated).toBe(0.25);
            expect(result.status).toBe('pending');
            expect(result.notes).toBe('test');
            expect(result.recordedDate).toBe('2025-06-15T10:00:00.000Z');
        });

        it('should handle null notes', () => {
            const rec: EmissionRecord = {
                id: '1', fuelTypeId: 'ft-1', quantity: 100, unit: 'kg',
                factorSnapshot: 2.5, tco2Calculated: 0.25, status: 'pending',
                recordedDate: now, notes: null, createdAt: now, updatedAt: now,
            };
            expect(toEmissionRecordResponse(rec).notes).toBeNull();
        });
    });

    describe('toEmissionRecordHistoryResponse', () => {
        it('should map EmissionRecordHistory to response', () => {
            const h: EmissionRecordHistory = {
                id: 'h1', emissionRecordId: 'rec-1', action: 'created',
                previousStatus: null, newStatus: 'pending', changedBy: null, metadata: null, createdAt: now,
            };
            const result = toEmissionRecordHistoryResponse(h);
            expect(result.id).toBe('h1');
            expect(result.previousStatus).toBeNull();
            expect(result.changedBy).toBeNull();
            expect(result.createdAt).toBe('2025-06-15T10:00:00.000Z');
        });

        it('should handle non-null changedBy and metadata', () => {
            const h: EmissionRecordHistory = {
                id: 'h1', emissionRecordId: 'rec-1', action: 'audited',
                previousStatus: 'pending', newStatus: 'audited', changedBy: 'user-1', metadata: '{"reason":"ok"}', createdAt: now,
            };
            const result = toEmissionRecordHistoryResponse(h);
            expect(result.changedBy).toBe('user-1');
            expect(result.metadata).toBe('{"reason":"ok"}');
        });
    });
});
