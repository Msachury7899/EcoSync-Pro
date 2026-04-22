---
id: SPEC-002
status: IMPLEMENTED
feature: microservices-bundling
created: 2026-03-30
updated: 2026-03-30
author: spec-generator
version: "1.0"
related-specs: []
---

# Spec: Orquestación y Empaquetado de Microservicios con ESBuild

> **Estado:** `APPROVED` — listo para implementación.
> **Ciclo de vida:** DRAFT → APPROVED → IN_PROGRESS → IMPLEMENTED → DEPRECATED

---

## 1. REQUERIMIENTOS

### Descripción
Se requiere un sistema de orquestación y empaquetado configurable que permita empaquetar el monolito modular en uno o más microservicios independientes usando ESBuild. Cada microservicio genera un único archivo `.js` minificado y ofuscado, ejecutable de forma autónoma, con endpoints asignados mediante un archivo de configuración central. Adicionalmente, se contempla un adaptador para consumo de APIs entre servicios.

### Requerimiento de Negocio
El cotizador de daños está compuesto por los microservicios `plataforma-daños-back` y `plataforma-core-ohs`. El arquitecto proyectó un monolito modular donde cada fragmento puede desplegarse individualmente o conectarse con otros. Se necesita un orquestador/empaquetador configurable en `application/microservices` que mediante ESBuild produzca artefactos contenerizables para cada servicio.

### Historias de Usuario

#### HU-01: Configuración de microservicios por archivo

```
Como:        Desarrollador / DevOps
Quiero:      Definir en un archivo de configuración qué endpoints pertenecen a cada microservicio
Para:        Poder empaquetar y desplegar cada servicio de forma independiente

Prioridad:   Alta
Estimación:  M
Dependencias: Ninguna
Capa:        Backend
```

#### Criterios de Aceptación — HU-01

**Happy Path**
```gherkin
CRITERIO-1.1: Empaquetado exitoso de un microservicio configurado
  Dado que:  existe un archivo de configuración en application/microservices/<service>.config.ts
             con los endpoints asignados al servicio
  Cuando:    se ejecuta el script de build para ese servicio
  Entonces:  se genera un único archivo .js en el directorio dist/<service>/
             minificado, ofuscado y ejecutable con `node dist/<service>/index.js`
```

**Happy Path 2**
```gherkin
CRITERIO-1.2: Servicio ejecutable levanta correctamente
  Dado que:  existe el artefacto dist/<service>/index.js
  Cuando:    se ejecuta `node dist/<service>/index.js`
  Entonces:  el servidor Express inicia en el puerto configurado
             y responde únicamente los endpoints definidos en su configuración
```

**Error Path**
```gherkin
CRITERIO-1.3: Configuración inválida detiene el build
  Dado que:  el archivo de configuración referencia un endpoint inexistente
  Cuando:    se ejecuta el script de build
  Entonces:  el proceso termina con código de salida distinto de 0
             y se emite un mensaje de error descriptivo
```

**Edge Case**
```gherkin
CRITERIO-1.4: Build incluye solo los módulos del servicio
  Dado que:  el monolito tiene múltiples features registrados en AppRoutes
  Cuando:    se empaqueta solo plataforma-daños-back
  Entonces:  el bundle resultante NO incluye código de plataforma-core-ohs
             verificado por tree-shaking de ESBuild
```

---

#### HU-02: Adaptador para consumo inter-servicios

```
Como:        Desarrollador backend
Quiero:      Contar con un adaptador HTTP en los controladores para consumir endpoints de otro microservicio
Para:        Poder obtener datos de plataforma-core-ohs desde plataforma-daños-back sin acoplamiento directo

Prioridad:   Media
Estimación:  S
Dependencias: HU-01
Capa:        Backend
```

#### Criterios de Aceptación — HU-02

**Happy Path**
```gherkin
CRITERIO-2.1: Adaptador realiza llamada exitosa a servicio externo
  Dado que:  la URL del servicio destino está configurada en variables de entorno
  Cuando:    un controlador invoca el adaptador con método, path y payload
  Entonces:  el adaptador retorna el body parsed de la respuesta HTTP
             con el código de status correcto
```

**Error Path**
```gherkin
CRITERIO-2.2: Adaptador maneja error de servicio externo
  Dado que:  el servicio externo responde con código 4xx o 5xx
  Cuando:    el adaptador recibe esa respuesta
  Entonces:  lanza un error tipado (DomainError) con el mensaje y código del servicio externo
```

---

#### HU-03: Resolución transparente de servicios locales vs. remotos

```
Como:        Desarrollador backend
Quiero:      Que el sistema determine automáticamente si un servicio dependiente
             corre en el mismo proceso (local) o en una URL externa (remoto)
Para:        Poder desplegar en modo monolito modular o microservicios puros
             sin cambiar el código de los controladores

Prioridad:   Alta
Estimación:  S
Dependencias: HU-02
Capa:        Backend
```

#### Criterios de Aceptación — HU-03

**Happy Path — modo local**
```gherkin
CRITERIO-3.1: Llamada directa cuando el servicio es local
  Dado que:  la variable de entorno CORE_OHS_MODE=local está configurada
  Cuando:    un controlador solicita datos de plataforma-core-ohs
  Entonces:  la llamada se resuelve directamente en la capa de servicio
             sin realizar ninguna petición HTTP
```

**Happy Path — modo remoto**
```gherkin
CRITERIO-3.2: Llamada HTTP cuando el servicio es remoto
  Dado que:  la variable de entorno CORE_OHS_MODE=remote está configurada
             y CORE_OHS_BASE_URL apunta al microservicio externo
  Cuando:    un controlador solicita datos de plataforma-core-ohs
  Entonces:  la llamada se realiza vía HTTP usando HttpServiceAdapter
             de forma transparente para el controlador
```

**Edge Case**
```gherkin
CRITERIO-3.3: Variable de entorno ausente o inválida detiene el inicio
  Dado que:  CORE_OHS_MODE no está definida o tiene un valor distinto a local|remote
  Cuando:    la aplicación inicia
  Entonces:  el proceso termina con error descriptivo antes de aceptar tráfico
```

---

### Reglas de Negocio
1. Cada microservicio debe tener su propio archivo de configuración en `src/application/microservices/<service>.config.ts`.
2. El archivo de configuración declara: nombre del servicio, puerto, prefijo de ruta y lista de routers a incluir.
3. El script de build usa ESBuild en modo `bundle: true`, `platform: 'node'`, `minify: true`, generando un único entrypoint por servicio.
4. El artefacto final es un solo archivo `.js` autocontenido — no requiere `node_modules` para ejecutarse.
5. El adaptador inter-servicios usa únicamente la URL base configurada por variable de entorno; nunca hardcoded.
6. Si un servicio no requiere consumir otro, el adaptador es opcional y no debe incluirse en el bundle.
7. La variable `<SERVICE>_MODE` acepta únicamente los valores `local` o `remote`; cualquier otro valor es un error de configuración fatal.
8. En modo `local`, el `LocalServiceAdapter` llama directamente a la interfaz de caso de uso del dominio sin pasar por HTTP. En modo `remote`, delega en `HttpServiceAdapter`.
9. Los controladores dependen únicamente de la interfaz `IServiceAdapter` — nunca de las implementaciones concretas.

---

## 2. DISEÑO

### Modelos de Datos

#### Entidades afectadas
| Entidad | Almacén | Cambios | Descripción |
|---------|---------|---------|-------------|
| N/A | N/A | N/A | Este feature no afecta modelos de datos de dominio |

*Este feature es puramente de infraestructura de build/deployment.*

---

### Estructura de Archivos Nueva

```
src/
  application/
    microservices/
      microservices.config.ts          ← Tipo compartido MicroserviceConfig
      plataforma-danos-back.config.ts  ← Configuración del servicio de daños
      plataforma-core-ohs.config.ts    ← Configuración del servicio core OHS
  infraestructure/
    adapters/
      HttpServiceAdapter.ts            ← Adaptador HTTP para consumo inter-servicios
      index.ts
scripts/
  build.ts                             ← Script ESBuild que lee configuraciones y genera bundles
  build-service.ts                     ← Helper para empaquetar un servicio individual
```

### Tipo MicroserviceConfig

```typescript
// src/application/microservices/microservices.config.ts
export interface MicroserviceConfig {
  name: string;              // Nombre del servicio (ej. "plataforma-danos-back")
  port: number;              // Puerto de escucha del servidor
  routePrefix: string;       // Prefijo base (ej. "/api/v1/danos")
  routers: RouterEntry[];    // Lista de routers a montar
}

export interface RouterEntry {
  path: string;              // Sub-path relativo al routePrefix
  routerModule: string;      // Import path relativo al src del router
}
```

### Configuraciones de Servicios

```typescript
// src/application/microservices/plataforma-danos-back.config.ts
import { MicroserviceConfig } from './microservices.config';

export const plataformaDanosConfig: MicroserviceConfig = {
  name: 'plataforma-danos-back',
  port: 3001,
  routePrefix: '/api/v1/danos',
  routers: [
    // Se irán añadiendo conforme se implementen los features:
    // { path: '/quotations', routerModule: '../features/quotations/quotations.routes' }
  ],
};
```

```typescript
// src/application/microservices/plataforma-core-ohs.config.ts
import { MicroserviceConfig } from './microservices.config';

export const plataformaCoreOhsConfig: MicroserviceConfig = {
  name: 'plataforma-core-ohs',
  port: 3002,
  routePrefix: '/api/v1/core',
  routers: [],
};
```

### Script de Build (ESBuild)

```typescript
// scripts/build-service.ts
// Recibe la config de un microservicio y ejecuta ESBuild con:
//   bundle: true, platform: 'node', minify: true, treeShaking: true
//   entryPoints: [generado dinámicamente desde MicroserviceConfig]
//   outfile: `dist/<service-name>/index.js`
```

Scripts npm a agregar en `package.json`:
```json
"build:danos": "ts-node scripts/build-service.ts --service=plataforma-danos-back",
"build:core": "ts-node scripts/build-service.ts --service=plataforma-core-ohs",
"build:all": "npm run build:danos && npm run build:core"
```

### Patrón Local/Remote Adapter

```
src/
  infraestructure/
    adapters/
      IServiceAdapter.ts          ← Interfaz común
      HttpServiceAdapter.ts       ← Implementación remota (fetch HTTP)
      LocalServiceAdapter.ts      ← Implementación local (llamada directa al dominio)
      ServiceAdapterFactory.ts    ← Lee <SERVICE>_MODE y retorna la implementación correcta
      index.ts
```

#### IServiceAdapter (interfaz común)

```typescript
// src/infraestructure/adapters/IServiceAdapter.ts
export interface IServiceAdapter {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
  delete<T>(path: string, body?: unknown): Promise<T>;
}
```

#### HttpServiceAdapter (modo remote)

```typescript
// src/infraestructure/adapters/HttpServiceAdapter.ts
export interface HttpAdapterOptions {
  baseUrl: string;           // URL base del servicio externo (desde envs)
  timeout?: number;          // ms, default 5000
}

export class HttpServiceAdapter implements IServiceAdapter {
  constructor(private readonly options: HttpAdapterOptions) {}

  async get<T>(path: string): Promise<T>;
  async post<T>(path: string, body: unknown): Promise<T>;
  async put<T>(path: string, body: unknown): Promise<T>;
  async delete<T>(path: string, body?: unknown): Promise<T>;
}
```

#### LocalServiceAdapter (modo local)

```typescript
// src/infraestructure/adapters/LocalServiceAdapter.ts
// Recibe el caso de uso local como dependencia y lo invoca directamente.
// El "path" se usa como discriminador para enrutar la llamada al método correcto.
export class LocalServiceAdapter implements IServiceAdapter {
  constructor(private readonly localHandler: ILocalServiceHandler) {}
  // ...
}

export interface ILocalServiceHandler {
  handle(method: string, path: string, body?: unknown): Promise<unknown>;
}
```

#### ServiceAdapterFactory

```typescript
// src/infraestructure/adapters/ServiceAdapterFactory.ts
// Lee <SERVICE>_MODE (local | remote) desde envs.
// Si remote → instancia HttpServiceAdapter con la URL del env.
// Si local  → instancia LocalServiceAdapter con el handler inyectado.
// Si valor inválido → lanza error fatal en startup.
export class ServiceAdapterFactory {
  static resolve(serviceName: string, localHandler?: ILocalServiceHandler): IServiceAdapter;
}
```

### Variables de Entorno Nuevas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `CORE_OHS_MODE` | Modo de resolución del servicio core-ohs | `local` \| `remote` |
| `DANOS_BACK_MODE` | Modo de resolución del servicio daños-back | `local` \| `remote` |
| `CORE_OHS_BASE_URL` | URL base (solo si `CORE_OHS_MODE=remote`) | `http://localhost:3002` |
| `DANOS_BASE_URL` | URL base (solo si `DANOS_BACK_MODE=remote`) | `http://localhost:3001` |

Añadir a `src/application/config/envs.ts`:
```typescript
CORE_OHS_MODE: get('CORE_OHS_MODE').required().asEnum(['local', 'remote']),
DANOS_BACK_MODE: get('DANOS_BACK_MODE').required().asEnum(['local', 'remote']),
CORE_OHS_BASE_URL: get('CORE_OHS_BASE_URL').asString(),   // requerido si CORE_OHS_MODE=remote
DANOS_BASE_URL: get('DANOS_BASE_URL').asString(),          // requerido si DANOS_BACK_MODE=remote
```

### Arquitectura y Dependencias
- Paquetes nuevos requeridos: ninguno (`esbuild` ya está en devDependencies)
- Servicios externos: ninguno nuevo
- Impacto en punto de entrada de la app: cada servicio tendrá su propio entrypoint generado dinámicamente; `src/launch.ts` permanece sin cambios para el modo desarrollo (`npm run dev`)

### Notas de Implementación
> - ESBuild está en devDependencies (`^0.27.4`); usar la API programática de Node para el script de build.
> - Los scripts de build son archivos TypeScript ejecutados con `ts-node`; ya disponible como devDependency.
> - El adaptador HTTP puede usar `fetch` nativo de Node 18+ o un wrapper liviano; NO añadir axios para mantener el bundle pequeño.
> - El `build-service.ts` genera un entrypoint temporal en `tmp/<service>/index.ts`, ESBuild lo empaqueta, y el directorio `tmp/` se limpia automáticamente al finalizar el build (éxito o error). Solo el artefacto `dist/` persiste.
> - La ofuscación se logra con `minify: true` de ESBuild (identifier renaming + whitespace removal). Estrategias de ofuscación adicionales quedan fuera del alcance de esta spec.
> - Tree-shaking de ESBuild garantiza que solo se empaquete el código de los routers declarados en el config.

---

## 3. LISTA DE TAREAS

> Checklist accionable para todos los agentes. Marcar cada ítem (`[x]`) al completarlo.
> El Orchestrator monitorea este checklist para determinar el progreso.

### Backend

#### Implementación
- [x] Crear `src/application/microservices/microservices.config.ts` — interfaz `MicroserviceConfig` y `RouterEntry`
- [x] Crear `src/application/microservices/plataforma-danos-back.config.ts` — configuración del servicio daños
- [x] Crear `src/application/microservices/plataforma-core-ohs.config.ts` — configuración del servicio core OHS
- [x] Crear `scripts/build-service.ts` — script ESBuild que lee config, genera entrypoint temporal y empaqueta
- [x] Agregar scripts `build:danos`, `build:core`, `build:all` en `package.json`
- [x] Crear `src/infraestructure/adapters/IServiceAdapter.ts` — interfaz común
- [x] Crear `src/infraestructure/adapters/HttpServiceAdapter.ts` — implementación remota con fetch nativo
- [x] Crear `src/infraestructure/adapters/LocalServiceAdapter.ts` — implementación local vía handler
- [x] Crear `src/infraestructure/adapters/ServiceAdapterFactory.ts` — resolución local|remote desde envs
- [x] Crear `src/infraestructure/adapters/index.ts` — barrel export
- [x] Agregar `CORE_OHS_MODE`, `DANOS_BACK_MODE`, `CORE_OHS_BASE_URL`, `DANOS_BASE_URL` a `src/application/config/envs.ts`

#### Tests Backend
- [ ] `buildService_generates_output_file` — build exitoso genera artefacto en `dist/`
- [ ] `buildService_invalid_config_throws` — config con router inexistente falla con error descriptivo
- [ ] `httpServiceAdapter_get_success` — GET exitoso retorna datos parseados
- [ ] `httpServiceAdapter_post_success` — POST exitoso retorna respuesta
- [ ] `httpServiceAdapter_handles_4xx_error` — error 4xx lanza DomainError tipado
- [ ] `httpServiceAdapter_handles_5xx_error` — error 5xx lanza DomainError tipado
- [ ] `httpServiceAdapter_handles_network_timeout` — timeout lanza DomainError
- [ ] `localServiceAdapter_calls_handler_directly` — modo local no realiza HTTP
- [ ] `serviceAdapterFactory_resolves_http_when_remote` — factory devuelve HttpServiceAdapter
- [ ] `serviceAdapterFactory_resolves_local_when_local` — factory devuelve LocalServiceAdapter
- [ ] `serviceAdapterFactory_throws_on_invalid_mode` — valor inválido lanza error fatal

### QA
- [ ] Ejecutar skill `/gherkin-case-generator` → criterios CRITERIO-1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 3.3
- [ ] Ejecutar skill `/risk-identifier` → clasificación ASD de riesgos
- [ ] Verificar que el artefacto generado no expone rutas no configuradas
- [ ] Verificar que variables de entorno sensibles no quedan hardcoded en el bundle
