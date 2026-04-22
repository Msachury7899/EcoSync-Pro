import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Service groups — mirrors allServiceConfigs in monolith.ts
// Add a new entry here whenever a service is registered in monolith.ts
// ---------------------------------------------------------------------------
export const serviceGroups = {
  all: ['jobs', 'study-areas'],
};

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const serviceArg = args.find((a) => a.startsWith('--service='));
const groupArg = args.find((a) => a.startsWith('--group='));
const serviceName = serviceArg ? serviceArg.split('=')[1] : null;
const groupName = groupArg ? groupArg.split('=')[1] : null;

// ---------------------------------------------------------------------------
// Resolve entrypoint and output directory
// ---------------------------------------------------------------------------
function resolveTarget(service) {
  if (!service) {
    return {
      entrypoint: 'src/core/bootstrap/launch-server.ts',
      outdir: 'dist/monolith',
      outfile: 'dist/monolith/index.js',
    };
  }
  return {
    entrypoint: `src/features/${service}/presentation/entrypoints/${service}.microservice.ts`,
    outdir: `dist/microservices/${service}`,
    outfile: `dist/microservices/${service}/index.js`,
  };
}

// ---------------------------------------------------------------------------
// Resolve targets to build (single service, group, or monolith)
// ---------------------------------------------------------------------------
let targets;
if (groupName) {
  const services = serviceGroups[groupName];
  if (!services) {
    console.error(`[build] Unknown group "${groupName}". Available: ${Object.keys(serviceGroups).join(', ')}`);
    process.exit(1);
  }
  targets = services.map((s) => resolveTarget(s));
} else {
  targets = [resolveTarget(serviceName)];
}

// ---------------------------------------------------------------------------
// Step 1 — TypeScript type-check (abort on failure)
// ---------------------------------------------------------------------------
console.log('[build] Running tsc --noEmit...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit', cwd: __dirname });
} catch {
  console.error('[build] TypeScript type-check failed. Aborting build.');
  process.exit(1);
}
console.log('[build] Type-check passed.');

// ---------------------------------------------------------------------------
// Path alias plugin — reads tsconfig.json paths and resolves @core/*, etc.
// Does NOT use the TypeScript compiler API — compatible with any TS version.
// ---------------------------------------------------------------------------
function makeTsconfigPathsPlugin() {
  const tsconfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'tsconfig.json'), 'utf-8'));
  const baseUrl = path.resolve(__dirname, tsconfig.compilerOptions.baseUrl ?? '.');
  const rawPaths = tsconfig.compilerOptions.paths ?? {};

  const mappings = Object.entries(rawPaths).map(([alias, [target]]) => {
    // '@core/*' → pattern /^@core\/(.*)$/, prefix 'core/'
    const prefix = alias.endsWith('/*') ? alias.slice(0, -2) : alias;
    const targetPrefix = target.endsWith('/*') ? target.slice(0, -2) : target;
    return { prefix, targetPrefix };
  });

  return {
    name: 'tsconfig-paths',
    setup(build) {
      build.onResolve({ filter: /^@/ }, (args) => {
        for (const { prefix, targetPrefix } of mappings) {
          if (args.path === prefix || args.path.startsWith(prefix + '/')) {
            const rest = args.path.slice(prefix.length);
            const base = path.resolve(baseUrl, targetPrefix + rest);
            for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx', '']) {
              const candidate = base + ext;
              if (fs.existsSync(candidate)) return { path: candidate };
            }
            return undefined; // no local file found — let esbuild resolve from node_modules
          }
        }
        return undefined;
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Externals — native / binary modules that must not be bundled
// ---------------------------------------------------------------------------
const external = [
  // Prisma — genera código en runtime, no se puede bundlear
  '@prisma/client',
  'prisma',
  // Swagger — sirve assets estáticos desde node_modules en runtime
  'swagger-ui-express',
  'swagger-ui-dist',
  'swagger-jsdoc',
  // Binarios nativos opcionales — excluir si alguno se añade al proyecto
  'sharp',
  'canvas',
  'fsevents',
  '@swc/*',
  'cpu-features',
  'ssh2',
  // Nota: bcryptjs (pure JS) sí se bundlea — NO añadir 'bcryptjs' aquí
];

// ---------------------------------------------------------------------------
// Step 2 — esbuild bundle (one per target)
// ---------------------------------------------------------------------------
const schemaSrc = path.resolve(__dirname, 'src/prisma/schema.prisma');

for (const { entrypoint, outdir, outfile } of targets) {
  console.log(`[build] Bundling ${entrypoint} → ${outfile}`);

  await esbuild.build({
    entryPoints: [path.resolve(__dirname, entrypoint)],
    outfile: path.resolve(__dirname, outfile),
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    minify: true,
    sourcemap: 'external',
    treeShaking: true,
    external,
    plugins: [makeTsconfigPathsPlugin()],
    absWorkingDir: __dirname,
  });

  console.log('[build] Bundle complete.');

  // Step 3 — Copy schema.prisma to output directory
  fs.mkdirSync(path.resolve(__dirname, outdir), { recursive: true });
  fs.cpSync(schemaSrc, path.resolve(__dirname, outdir, 'schema.prisma'));
  console.log(`[build] Copied schema.prisma → ${outdir}/schema.prisma`);
}
