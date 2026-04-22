import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { ulid } from 'ulid';

import { envs } from '@core/envs';
import {
    fuelTypes,
    emissionFactors,
    plants,
    emissionRecords,
    emissionRecordHistory,
} from './schema';

const databaseUrl = envs.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required');

const sql = postgres(databaseUrl, { max: 1 });
const db = drizzle(sql);

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
}

function randomBetween(min: number, max: number): number {
    return parseFloat((Math.random() * (max - min) + min).toFixed(4));
}

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const FUEL_TYPE_DATA = [
    { name: 'Diesel B5',        description: 'Mezcla de diesel con 5% de biodiesel. Uso industrial y transporte pesado.' },
    { name: 'Gasolina 95',      description: 'Combustible para motores de ciclo Otto. Octanaje 95.' },
    { name: 'Gas Natural GNC',  description: 'Gas natural comprimido para vehículos y generadores.' },
    { name: 'GLP',              description: 'Gas licuado de petróleo. Mezcla de propano y butano.' },
    { name: 'Biodiesel B100',   description: 'Biodiesel puro derivado de aceites vegetales.' },
    { name: 'Carbón Mineral',   description: 'Carbón bituminoso usado en hornos y calderas industriales.' },
    { name: 'Fuel Oil N°6',     description: 'Fuel oil pesado para calderas de gran capacidad.' },
    { name: 'Queroseno Jet A1', description: 'Combustible de aviación turbina. Alta pureza.' },
    { name: 'Gas Propano',      description: 'Propano comercial para procesos industriales de calor.' },
    { name: 'Etanol E85',       description: 'Mezcla 85% etanol, 15% gasolina. Bajo en carbono.' },
];

const PLANT_DATA = [
    { name: 'Planta Norte – Barranquilla',  location: 'Barranquilla, Atlántico',    monthlyLimitTco2: 520.0  },
    { name: 'Planta Centro – Bogotá',       location: 'Bogotá, Cundinamarca',       monthlyLimitTco2: 380.0  },
    { name: 'Planta Sur – Cali',            location: 'Cali, Valle del Cauca',      monthlyLimitTco2: 440.0  },
    { name: 'Planta Oriente – Bucaramanga', location: 'Bucaramanga, Santander',     monthlyLimitTco2: 310.0  },
    { name: 'Planta Caribe – Cartagena',    location: 'Cartagena, Bolívar',         monthlyLimitTco2: 600.0  },
    { name: 'Planta Eje Cafetero – Manizales', location: 'Manizales, Caldas',       monthlyLimitTco2: 270.0  },
    { name: 'Planta Antioquia – Medellín',  location: 'Medellín, Antioquia',        monthlyLimitTco2: 490.0  },
];

const STATUSES = ['pending', 'pending', 'approved', 'approved', 'approved', 'rejected'];
const UNITS    = ['L', 'kg', 'm3', 'gal', 'ton'];
const NOTES    = [
    'Registro mensual rutinario',
    'Consumo elevado por mantenimiento de planta',
    'Medición verificada con medidor certificado',
    'Ajuste por cambio de proveedor',
    'Consumo normal en temporada alta',
    null,
    null,
    'Registro corregido por error de transcripción',
    'Respaldo documental en sistema DMS',
    'Auditoría interna validada',
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🌱 Iniciando seeding...\n');

    // 1. Fuel Types
    console.log('⛽  Insertando tipos de combustible...');
    const fuelTypeIds: string[] = [];
    for (const ft of FUEL_TYPE_DATA) {
        const id = ulid();
        fuelTypeIds.push(id);
        await db.insert(fuelTypes).values({
            id,
            name:        ft.name,
            description: ft.description,
            createdAt:   daysAgo(365),
            updatedAt:   daysAgo(30),
        });
    }
    console.log(`   ✅ ${fuelTypeIds.length} fuel types insertados\n`);

    // 2. Emission Factors (2–3 factores por combustible con fechas escalonadas)
    console.log('📊 Insertando factores de emisión...');
    const emissionFactorRows: { id: string; fuelTypeId: string; factorKgco2PerUnit: number }[] = [];
    const baseFactors = [2.68, 2.31, 2.04, 1.63, 0.04, 2.42, 3.17, 2.55, 1.51, 1.22];
    for (let i = 0; i < fuelTypeIds.length; i++) {
        const fuelTypeId = fuelTypeIds[i];
        const base       = baseFactors[i];
        // Factor histórico (hace 2 años)
        const id1 = ulid();
        await db.insert(emissionFactors).values({
            id: id1, fuelTypeId,
            factorKgco2PerUnit: parseFloat((base * 1.05).toFixed(4)),
            unit:          UNITS[i % UNITS.length],
            effectiveFrom: daysAgo(730),
            createdAt:     daysAgo(730),
        });
        // Factor actual (hace 1 año)
        const id2 = ulid();
        await db.insert(emissionFactors).values({
            id: id2, fuelTypeId,
            factorKgco2PerUnit: base,
            unit:          UNITS[i % UNITS.length],
            effectiveFrom: daysAgo(365),
            createdAt:     daysAgo(365),
        });
        emissionFactorRows.push({ id: id2, fuelTypeId, factorKgco2PerUnit: base });
    }
    console.log(`   ✅ ${emissionFactorRows.length * 2} factores de emisión insertados\n`);

    // 3. Plants
    console.log('🏭 Insertando plantas...');
    for (const p of PLANT_DATA) {
        await db.insert(plants).values({
            id:                ulid(),
            name:              p.name,
            location:          p.location,
            monthlyLimitTco2:  p.monthlyLimitTco2,
            createdAt:         daysAgo(400),
            updatedAt:         daysAgo(15),
        });
    }
    console.log(`   ✅ ${PLANT_DATA.length} plantas insertadas\n`);

    // 4. Emission Records — ~15 registros por mes durante 12 meses = ~180 registros
    //    Garantiza al menos 1 registro por combustible por mes para gráficas completas
    console.log('📝 Insertando registros de emisión...');
    const recordIds: string[] = [];
    const recordStatuses: string[] = [];

    // Distribución controlada: 12 meses × ~15 registros
    for (let month = 0; month < 12; month++) {
        const baseDay = month * 30; // días desde hoy hacia atrás (mes 0 = más reciente)
        const recordsThisMonth = 13 + Math.floor(Math.random() * 5); // 13–17 por mes

        for (let r = 0; r < recordsThisMonth; r++) {
            const factor   = emissionFactorRows[r % emissionFactorRows.length]; // rotar todos los combustibles
            const quantity = randomBetween(15, 600);
            const tco2     = parseFloat((quantity * factor.factorKgco2PerUnit / 1000).toFixed(6));
            const status   = pickRandom(STATUSES);
            const id       = ulid();
            // Día aleatorio dentro del mes correspondiente
            const daysBack = baseDay + Math.floor(Math.random() * 28) + 1;

            recordIds.push(id);
            recordStatuses.push(status);

            await db.insert(emissionRecords).values({
                id,
                fuelTypeId:     factor.fuelTypeId,
                quantity,
                unit:           UNITS[(month + r) % UNITS.length],
                factorSnapshot: factor.factorKgco2PerUnit,
                tco2Calculated: tco2,
                status,
                recordedDate:   daysAgo(daysBack),
                notes:          pickRandom(NOTES),
                createdAt:      daysAgo(daysBack),
                updatedAt:      daysAgo(Math.max(0, daysBack - 2)),
            });
        }
    }
    console.log(`   ✅ ${recordIds.length} registros de emisión insertados\n`);

    // 5. Emission Record History
    console.log('📜 Insertando historial de registros...');
    let historyCount = 0;

    for (let i = 0; i < recordIds.length; i++) {
        const emissionRecordId = recordIds[i];
        const finalStatus      = recordStatuses[i];

        // Todos pasan primero por "created"
        await db.insert(emissionRecordHistory).values({
            id:             ulid(),
            emissionRecordId,
            action:         'created',
            previousStatus: null,
            newStatus:      'pending',
            changedBy:      'system',
            metadata:       JSON.stringify({ source: 'seed' }),
            createdAt:      daysAgo(Math.floor(Math.random() * 360) + 5),
        });
        historyCount++;

        if (finalStatus === 'approved') {
            await db.insert(emissionRecordHistory).values({
                id:             ulid(),
                emissionRecordId,
                action:         'approved',
                previousStatus: 'pending',
                newStatus:      'approved',
                changedBy:      pickRandom(['admin@ecosync.co', 'supervisor@ecosync.co', 'auditor@ecosync.co']),
                metadata:       JSON.stringify({ comment: 'Verificado y aprobado' }),
                createdAt:      daysAgo(Math.floor(Math.random() * 3) + 1),
            });
            historyCount++;
        }

        if (finalStatus === 'rejected') {
            await db.insert(emissionRecordHistory).values({
                id:             ulid(),
                emissionRecordId,
                action:         'rejected',
                previousStatus: 'pending',
                newStatus:      'rejected',
                changedBy:      pickRandom(['admin@ecosync.co', 'supervisor@ecosync.co']),
                metadata:       JSON.stringify({ reason: 'Datos inconsistentes con medidor externo' }),
                createdAt:      daysAgo(Math.floor(Math.random() * 3) + 1),
            });
            historyCount++;
        }
    }
    console.log(`   ✅ ${historyCount} entradas de historial insertadas\n`);

    console.log('✅ Seeding completado exitosamente.');
    await sql.end();
}

main().catch((e) => {
    console.error('❌ Error durante el seeding:', e);
    process.exit(1);
});
