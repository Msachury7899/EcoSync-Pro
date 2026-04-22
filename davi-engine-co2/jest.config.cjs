/**
 * Jest config — Odin backend
 *
 * Convenciones:
 * - Tests co-locados junto al archivo bajo prueba: src/**\/*.spec.ts
 * - Tests manuales críticos del humano: tests/**\/*.spec.ts
 * - Transformer: @swc/jest (rápido). Fallback a ts-jest si @swc/jest no está instalado.
 *   Para activar SWC: npm i -D @swc/core @swc/jest
 */

let transform;
try {
  require.resolve('@swc/jest');
  transform = {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', decorators: true },
          target: 'es2020',
          baseUrl: '.',
          paths: {
            '@core/*': ['src/core/*'],
            '@features/*': ['src/features/*'],
            '@db/*': ['src/db/*'],
          },
        },
      },
    ],
  };
} catch (_) {
  transform = {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  };
}

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/tests/**/*.test.ts',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@db/(.*)$': '<rootDir>/src/db/$1',
  },
  transform,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Cobertura — solo lógica de negocio (domain + application)
  collectCoverageFrom: [
    'src/features/**/domain/**/*.ts',
    'src/features/**/application/**/*.ts',
    '!src/features/**/*.d.ts',
    '!src/features/**/index.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text-summary', 'lcov'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },

  // Velocidad
  maxWorkers: 1, // Obliga a Jest a correr en secuencia (RunInBand) para evitar choques en la BD de Test
  cache: true,
  bail: 0,
  setupFiles: [
    "<rootDir>/setupTest.ts"
  ],
  // Tags para smoke/regresión (uso: jest -t "@smoke")
  // Se filtran vía -t, no requieren runner extra.
};
