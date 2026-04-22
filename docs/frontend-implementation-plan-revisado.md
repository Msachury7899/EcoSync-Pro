# Plan de Implementación Frontend — EcoSync (Revisado y Ajustado)
> Estado: **PENDIENTE DE IMPLEMENTACIÓN**  
> Versión: 2.0 — Ajustado según decisiones del 22/04/2026  
> Generado con: `ui-ux-pro-max v2.5.0`  
> Stack: Angular 21 + Tailwind CSS 4

---

## Decisiones Cerradas

| # | Decisión | Resolución |
|---|---|---|
| D1 | Modo visual | **Light mode únicamente** |
| D2 | Sidebar | **Colapsable** (expandido en desktop, icon-only en mobile/colapso manual) |
| D3 | Selector de planta | **Global** — persiste entre páginas vía signal en `core/` |
| D4 | Autenticación | **No incluida** en este sprint — interceptor preparado pero sin guard activo |

---

## 1. Design System (Light Mode)

> Fuente: `ui-ux-pro-max` → estilo `Data-Dense Dashboard` adaptado a EcoSync

### 1.1 Estilo Visual
| Atributo | Decisión |
|---|---|
| Estilo base | **Data-Dense Dashboard** — grid 12 columnas, cards compactas, máxima densidad de información |
| Modo | **Light mode únicamente** |
| Sidebar | `240px` expandido / `64px` colapsado — transición `300ms ease` |
| Header height | `56px` fijo |
| Grid gap | `8px` — `12px` en breakpoints grandes |
| Row height tabla | `36px` |

### 1.2 Paleta de Colores (Light Mode)

| Token CSS | Valor | Uso |
|---|---|---|
| `--color-bg-base` | `#F8FAFC` | Fondo general (slate-50) |
| `--color-bg-surface` | `#FFFFFF` | Tarjetas, panels (blanco) |
| `--color-bg-elevated` | `#F1F5F9` | Hover de rows, inputs focus (slate-100) |
| `--color-border` | `#E2E8F0` | Bordes de componentes (slate-200) |
| `--color-primary` | `#16A34A` | Acciones primarias, CTA (green-600) |
| `--color-primary-hover` | `#15803D` | Hover de primario (green-700) |
| `--color-primary-light` | `#DCFCE7` | Fondo de badge "OK" / indicadores positivos (green-100) |
| `--color-warning` | `#D97706` | Próximo al límite — 80–100% (amber-600) |
| `--color-warning-light` | `#FEF3C7` | Fondo badge warning (amber-100) |
| `--color-danger` | `#DC2626` | Por encima del límite (red-600) |
| `--color-danger-light` | `#FEE2E2` | Fondo badge danger (red-100) |
| `--color-audited` | `#0284C7` | Badge "Auditado" (sky-600) |
| `--color-audited-light` | `#E0F2FE` | Fondo badge auditado (sky-100) |
| `--color-text-primary` | `#0F172A` | Texto principal (slate-900) |
| `--color-text-secondary` | `#475569` | Texto secundario (slate-600) |
| `--color-text-muted` | `#94A3B8` | Texto deshabilitado/placeholder (slate-400) |
| `--sidebar-width` | `240px` | Sidebar expandido |
| `--sidebar-collapsed-width` | `64px` | Sidebar colapsado |
| `--header-height` | `56px` | Header fijo |

### 1.3 Tipografía

| Rol | Fuente | Pesos |
|---|---|---|
| Headings | **Plus Jakarta Sans** | 600, 700 |
| Body / UI | **Plus Jakarta Sans** | 300, 400, 500 |

```css
/* styles.css */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
```

### 1.4 Efectos e Interacciones

| Efecto | Regla Tailwind |
|---|---|
| Transiciones | `transition-all duration-150 ease-in-out` (hover/focus) |
| Sidebar collapse | `transition-all duration-300 ease-in-out` |
| Hover en rows | `hover:bg-[var(--color-bg-elevated)]` |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none` |
| Sombra tarjetas | `shadow-sm hover:shadow-md` |
| `prefers-reduced-motion` | `@media (prefers-reduced-motion: reduce) { transition: none }` |

### 1.5 Tokens en styles.css

```css
:root {
  --color-bg-base: #F8FAFC;
  --color-bg-surface: #FFFFFF;
  --color-bg-elevated: #F1F5F9;
  --color-border: #E2E8F0;
  --color-primary: #16A34A;
  --color-primary-hover: #15803D;
  --color-primary-light: #DCFCE7;
  --color-warning: #D97706;
  --color-warning-light: #FEF3C7;
  --color-danger: #DC2626;
  --color-danger-light: #FEE2E2;
  --color-audited: #0284C7;
  --color-audited-light: #E0F2FE;
  --color-text-primary: #0F172A;
  --color-text-secondary: #475569;
  --color-text-muted: #94A3B8;
  --sidebar-width: 240px;
  --sidebar-collapsed-width: 64px;
  --header-height: 56px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
```

---

## 2. Librería de Charts

**`ng-apexcharts`** (ApexCharts para Angular)

```bash
npm install ng-apexcharts apexcharts
npm install lucide-angular
```

| Chart | Tipo | Feature |
|---|---|---|
| Cumplimiento mensual | **Bar Chart vertical** + línea `annotations.yaxis` = límite | Dashboard |
| Tendencia diaria | **Smooth Area Chart** | Dashboard |
| Distribución por combustible | **Donut Chart** | Dashboard |

**Semáforo de barras según % del límite:**
- `< 80%` del límite → `#16A34A` (verde)
- `80%–99%` → `#D97706` (ámbar)
- `≥ 100%` → `#DC2626` (rojo)

---

## 3. Arquitectura de Carpetas

```
frontend/src/app/
├── core/
│   ├── interceptors/
│   │   └── http-auth.interceptor.ts
│   ├── services/
│   │   ├── api-client.service.ts
│   │   └── plant-selector.service.ts       ← signal global de planta activa
│   └── models/
│       └── api-response.model.ts
│
├── shared/
│   └── components/
│       ├── atoms/
│       │   ├── button/
│       │   ├── badge/
│       │   ├── input-field/
│       │   ├── select-field/
│       │   ├── spinner/
│       │   └── stat-card/
│       ├── molecules/
│       │   ├── form-control/
│       │   ├── fuel-selector/
│       │   └── confirmation-dialog/
│       └── organisms/
│           ├── page-header/
│           └── sidebar-nav/               ← colapsable
│
└── features/
    ├── emissions/
    │   ├── components/
    │   │   ├── emission-form/
    │   │   └── emission-list/
    │   ├── services/
    │   │   ├── emissions-api.service.ts
    │   │   └── emission-form.service.ts
    │   ├── models/
    │   │   └── emission-record.model.ts
    │   └── emissions.routes.ts
    │
    ├── dashboard/
    │   ├── components/
    │   │   ├── compliance-chart/
    │   │   ├── trend-chart/
    │   │   └── fuel-breakdown-chart/
    │   ├── services/
    │   │   └── dashboard-api.service.ts
    │   ├── models/
    │   │   └── dashboard-metrics.model.ts
    │   └── dashboard.routes.ts
    │
    └── audit/
        ├── components/
        │   ├── audit-list/
        │   └── audit-actions/
        ├── services/
        │   └── audit-api.service.ts
        ├── models/
        │   └── audit-record.model.ts
        └── audit.routes.ts
```

---

## 4. Checklist de Implementación

> Marcar cada ítem al completarlo. Seguir el orden de fases — cada fase desbloquea la siguiente.

---

### FASE 0 — Setup y Configuración Base

- [ ] **F0-01** Instalar dependencias: `npm install ng-apexcharts apexcharts lucide-angular`
- [ ] **F0-02** Configurar tokens CSS en `src/styles.css` (paleta + tipografía + variables de layout)
- [ ] **F0-03** Importar fuente Plus Jakarta Sans en `src/styles.css`
- [ ] **F0-04** Agregar `provideHttpClient()` en `app.config.ts`
- [ ] **F0-05** Definir rutas lazy en `app.routes.ts` (`/emissions`, `/dashboard`, `/audit`, redirect `/`)
- [ ] **F0-06** Crear layout shell `AppComponent` con `<router-outlet>` + estructura `sidebar + main-content`

---

### FASE 1 — Core y Servicios Globales

- [ ] **F1-01** Crear `core/models/api-response.model.ts` — tipo genérico `ApiResponse<T>`
- [ ] **F1-02** Crear `core/services/api-client.service.ts` — `HttpClient` base con URL de entorno
- [ ] **F1-03** Crear `core/services/plant-selector.service.ts` — `signal<Plant | null>` + método `setPlant()`
- [ ] **F1-04** Crear `core/interceptors/http-auth.interceptor.ts` — preparado (sin guard activo)

---

### FASE 2 — Átomos (Shared/Atoms)

- [ ] **F2-01** `eco-button` — variantes: `primary`, `secondary`, `danger`, `ghost`; tamaños `sm`, `md`, `lg`; estado `loading` con spinner inline
- [ ] **F2-02** `eco-badge` — variantes: `success`, `warning`, `danger`, `info`, `audited`, `pending`; usa `--color-*-light` de fondo
- [ ] **F2-03** `eco-input` — input text/number/date con label visible, placeholder muted, borde `--color-border`, focus ring verde, estado error
- [ ] **F2-04** `eco-select` — select nativo estilizado, compatible con Angular `FormControl`, estado error
- [ ] **F2-05** `eco-spinner` — tamaños `sm/md/lg`, color configurable (default `--color-primary`)
- [ ] **F2-06** `eco-stat-card` — tile KPI: título, valor grande, unidad, tendencia (↑↓ con color semántico), estado skeleton

---

### FASE 3 — Moléculas y Organismos (Shared)

- [ ] **F3-01** `form-control` — wrapper: `eco-input` o `eco-select` + label superior + mensaje de error debajo (ngIf touched && invalid)
- [ ] **F3-02** `fuel-selector` — molecule: select de `fuel_type` + select de `unidad` dependiente; carga `GET /fuel-types` al init
- [ ] **F3-03** `confirmation-dialog` — modal con overlay; `@Input` título/mensaje/label-confirm; emit `(confirmed)`
- [ ] **F3-04** `page-header` — organism: título de página + breadcrumb + slot para acciones (ng-content)
- [ ] **F3-05** `sidebar-nav` — organism: links de navegación + toggle de colapso; estado expandido/colapsado en `signal<boolean>`; inyecta `PlantSelectorService` para mostrar planta activa en footer del sidebar

---

### FASE 4 — Selector Global de Planta

- [ ] **F4-01** Componente `plant-selector` (atom/molecule) — select que lee plantas de `GET /plants` y llama `PlantSelectorService.setPlant()`
- [ ] **F4-02** Integrar `plant-selector` en el header o sidebar-nav (visible en todas las páginas)
- [ ] **F4-03** Validar que el `signal` de planta activa sea accesible en features de dashboard y audit

---

### FASE 5 — Feature: Registro de Emisiones (`/emissions`)

**Formulario dinámico**

- [ ] **F5-01** Crear `emission-record.model.ts` — tipos: `EmissionRecord`, `CreateEmissionRecordDto`, `FuelType`, `Plant`
- [ ] **F5-02** Crear `emissions-api.service.ts` — métodos: `getFuelTypes()`, `getPlants()`, `createEmissionRecord(dto)`
- [ ] **F5-03** Crear `emission-form.service.ts` — `FormGroup` reactivo con `FormBuilder`; validadores: required, min(0.01), max(999999)
- [ ] **F5-04** Componente `emission-form` — organism:
  - [ ] Select Planta (usa `eco-select` + `form-control`)
  - [ ] Date picker Fecha (no futura — validador custom `maxDate: today`)
  - [ ] `fuel-selector` molecule (combustible + unidad dependiente)
  - [ ] Input Cantidad (type number, validación inline `onBlur` + `valueChanges debounceTime(300)`)
  - [ ] Botón Submit con estado loading → badge éxito/error inline
- [ ] **F5-05** Validaciones en tiempo real — mensajes: "Requerido", "Debe ser mayor a 0", "No puede ser fecha futura"
- [ ] **F5-06** Al submit exitoso: resetear form + mostrar `eco-badge success` con tCO₂ calculado recibido en response
- [ ] **F5-07** Componente `emission-list` — tabla de registros recientes (`GET /emission-records?plant=X&limit=10`)
  - [ ] Columnas: Fecha, Combustible, Cantidad, Unidad, tCO₂, Estado
  - [ ] `eco-badge` de estado en columna Estado
  - [ ] Skeleton loader en carga inicial
- [ ] **F5-08** Lazy route `emissions.routes.ts` con `providers: [EmissionsApiService, EmissionFormService]`
- [ ] **F5-09** Página `EmissionsPageComponent` — layout: `page-header` + form (izq) + lista reciente (der)

---

### FASE 6 — Feature: Dashboard de Cumplimiento (`/dashboard`)

- [ ] **F6-01** Crear `dashboard-metrics.model.ts` — tipos: `ComplianceData`, `TrendData`, `FuelBreakdownData`
- [ ] **F6-02** Crear `dashboard-api.service.ts` — métodos: `getCompliance(plant, month)`, `getTrend(plant, month)`, `getFuelBreakdown(plant, month)`
- [ ] **F6-03** Componente `compliance-chart` — Bar Chart vertical (ApexCharts)
  - [ ] Barras mensuales de tCO₂ real — color semántico según % del límite
  - [ ] Línea de anotación horizontal `annotations.yaxis` = límite mensual de planta
  - [ ] Tooltip: "X tCO₂ de Y tCO₂ límite (Z%)"
  - [ ] Skeleton mientras carga
- [ ] **F6-04** Componente `trend-chart` — Smooth Area Chart (ApexCharts)
  - [ ] Eje X = días del mes seleccionado
  - [ ] Eje Y = tCO₂ acumuladas del día
  - [ ] Color de área: `#16A34A` con opacidad 20%
  - [ ] Skeleton mientras carga
- [ ] **F6-05** Componente `fuel-breakdown-chart` — Donut Chart (ApexCharts)
  - [ ] Segmentos = tipos de combustible del mes
  - [ ] Leyenda con porcentaje y tCO₂ absoluto
  - [ ] Skeleton mientras carga
- [ ] **F6-06** Filtro de mes — `<input type="month">` que dispara re-fetch de los 3 charts
- [ ] **F6-07** Row de `eco-stat-card` KPIs:
  - [ ] Total tCO₂ del mes
  - [ ] % del límite consumido
  - [ ] Registros del mes
  - [ ] Días restantes en el mes
- [ ] **F6-08** Lazy route `dashboard.routes.ts` con `providers: [DashboardApiService]`
- [ ] **F6-09** Página `DashboardPageComponent` — layout: `page-header` + selector mes + KPIs row + grid de 3 charts

---

### FASE 7 — Feature: Auditoría e Historial (`/audit`)

- [ ] **F7-01** Crear `audit-record.model.ts` — tipos: `AuditRecord`, `EmissionHistoryEntry`
- [ ] **F7-02** Crear `audit-api.service.ts` — métodos: `getAuditList(params)`, `markAsAudited(id)`, `exportRecords(params)`
- [ ] **F7-03** Componente `audit-list` — tabla historial inmutable
  - [ ] Columnas: Fecha, Planta, Combustible, Cantidad, Unidad, tCO₂, Estado, Auditado por, Fecha auditoría
  - [ ] `eco-badge` para estado (`pending` / `audited`)
  - [ ] Paginación server-side (`page` + `limit`) — componente de paginación inline
  - [ ] Filtros: rango de fechas + estado (pending/audited)
  - [ ] Skeleton en carga inicial
  - [ ] Sin acciones de editar/eliminar (historial inmutable)
- [ ] **F7-04** Componente `audit-actions` — columna de acciones
  - [ ] Botón "Marcar como Auditado" — solo visible si estado = `pending`
  - [ ] Al click: abrir `confirmation-dialog` → al confirmar: `PATCH /emission-records/:id/audit`
  - [ ] Al confirmar: actualizar badge en la fila sin recargar la tabla completa (actualización local del signal)
- [ ] **F7-05** Botón "Exportar" — llama `GET /emission-records/export` → descarga blob (CSV/PDF según respuesta del backend)
  - [ ] Estado loading en botón durante descarga
  - [ ] Manejo de error si el endpoint falla
- [ ] **F7-06** Lazy route `audit.routes.ts` con `providers: [AuditApiService]`
- [ ] **F7-07** Página `AuditPageComponent` — layout: `page-header` + botón exportar (en `page-header` slot) + filtros + tabla

---

### FASE 8 — Layout Shell y Navegación

- [ ] **F8-01** `AppComponent` — estructura: `<eco-sidebar-nav>` + `<main>` con `<router-outlet>`; clase CSS condicional según estado del sidebar
- [ ] **F8-02** `sidebar-nav` — links:
  - [ ] Dashboard → `/dashboard` (ícono: `BarChart2` de Lucide)
  - [ ] Emisiones → `/emissions` (ícono: `Wind`)
  - [ ] Auditoría → `/audit` (ícono: `ClipboardCheck`)
- [ ] **F8-03** Botón toggle en sidebar — ícono `ChevronLeft/ChevronRight`; en colapso solo muestra íconos (sin texto)
- [ ] **F8-04** Header fijo `56px` — logo EcoSync izq + `plant-selector` centro/der
- [ ] **F8-05** Active link highlight en sidebar — `routerLinkActive` con clase `bg-primary-light text-primary font-600`
- [ ] **F8-06** Responsive: sidebar overlay en mobile (`< 768px`) — click fuera cierra

---

### FASE 9 — Calidad y Checklist ui-ux-pro-max

- [ ] **F9-01** Sin emojis como íconos — todos los íconos son `lucide-angular`
- [ ] **F9-02** `cursor-pointer` en todos los elementos clicables (botones, rows, links)
- [ ] **F9-03** Transiciones `150–300ms ease` en todos los hover/focus
- [ ] **F9-04** Contraste texto ≥ 4.5:1 (WCAG AA) verificado en colores semánticos
- [ ] **F9-05** `focus-visible` ring visible para navegación por teclado en todos los interactivos
- [ ] **F9-06** `prefers-reduced-motion` — desactivar animaciones si el sistema lo solicita
- [ ] **F9-07** Responsivo en `375px`, `768px`, `1024px`, `1440px`
- [ ] **F9-08** Skeleton loaders en carga inicial de charts y tablas
- [ ] **F9-09** Validación inline en formularios (`onBlur` + `valueChanges debounceTime`)
- [ ] **F9-10** Feedback de submit: loading → success/error inline
- [ ] **F9-11** `ChangeDetectionStrategy.OnPush` en todos los componentes
- [ ] **F9-12** Todos los componentes `standalone: true`
- [ ] **F9-13** `placeholder:text-slate-400` en todos los inputs

---

---

### FASE 10 — Pruebas Unitarias (Jasmine / Karma · cobertura ≥ 80 %)

> **Nota de setup:** el proyecto tiene `tsconfig.spec.json` con tipos `vitest/globals`. Se requiere migrar a Jasmine/Karma como primera tarea de esta fase.

#### F10-00 — Migración de entorno de tests a Jasmine/Karma

- [ ] **F10-00-01** Instalar dependencias de test:
  ```bash
  npm install --save-dev karma karma-chrome-launcher karma-jasmine karma-jasmine-html-reporter karma-coverage jasmine-core @types/jasmine
  ```
- [ ] **F10-00-02** Crear `karma.conf.js` en la raíz de `frontend/`:
  ```js
  module.exports = function(config) {
    config.set({
      basePath: '',
      frameworks: ['jasmine', '@angular-devkit/build-angular'],
      plugins: [
        require('karma-jasmine'),
        require('karma-chrome-launcher'),
        require('karma-jasmine-html-reporter'),
        require('karma-coverage'),
        require('@angular-devkit/build-angular/plugins/karma'),
      ],
      reporters: ['progress', 'kjhtml', 'coverage'],
      coverageReporter: { dir: 'coverage/', reporters: [{ type: 'html' }, { type: 'text-summary' }] },
      browsers: ['ChromeHeadless'],
      singleRun: true,
    });
  };
  ```
- [ ] **F10-00-03** Actualizar `tsconfig.spec.json` — reemplazar `"vitest/globals"` por `"jasmine"` en `types`
- [ ] **F10-00-04** Actualizar `angular.json` — en `architect.test` configurar `builder: "@angular-devkit/build-angular:karma"` con `karmaConfig: "karma.conf.js"` y `codeCoverage: true`
- [ ] **F10-00-05** Verificar `ng test --watch=false` ejecuta sin errores en el `AppComponent` existente

---

#### F10-01 — Tests: Core Services

**`plant-selector.service.spec.ts`**
- [ ] **F10-01-01** `setPlant(plant)` actualiza el signal `activePlant` con el valor correcto
- [ ] **F10-01-02** `setPlant(null)` limpia el signal a `null`
- [ ] **F10-01-03** El valor del signal es reactivo — computed() refleja el cambio inmediatamente

**`api-client.service.spec.ts`**
- [ ] **F10-01-04** Se instancia correctamente con `HttpClientTestingModule`
- [ ] **F10-01-05** La URL base se toma del entorno (`environment.apiUrl`) y no está hardcodeada

---

#### F10-02 — Tests: Átomos

**`eco-button.component.spec.ts`**
- [ ] **F10-02-01** Renderiza el texto del `@Input() label` en el DOM
- [ ] **F10-02-02** Con `[variant]="'primary'"` aplica la clase CSS de primario
- [ ] **F10-02-03** Con `[loading]="true"` muestra `eco-spinner` y deshabilita el botón (`disabled=true`)
- [ ] **F10-02-04** Con `[loading]="false"` no muestra `eco-spinner`
- [ ] **F10-02-05** Emite evento `(clicked)` al hacer click cuando no está en loading

**`eco-badge.component.spec.ts`**
- [ ] **F10-02-06** Con `[variant]="'success'"` aplica clases de color verde
- [ ] **F10-02-07** Con `[variant]="'danger'"` aplica clases de color rojo
- [ ] **F10-02-08** Con `[variant]="'audited'"` aplica clases de color sky
- [ ] **F10-02-09** Con `[variant]="'pending'"` aplica clases de color ámbar

**`eco-stat-card.component.spec.ts`**
- [ ] **F10-02-10** Renderiza `title`, `value` y `unit` pasados por `@Input`
- [ ] **F10-02-11** Con `[loading]="true"` muestra skeleton en lugar de valor
- [ ] **F10-02-12** Tendencia positiva muestra color verde; negativa muestra color rojo

---

#### F10-03 — Tests: Moléculas y Organismos Shared

**`form-control.component.spec.ts`**
- [ ] **F10-03-01** Muestra el `label` pasado por `@Input`
- [ ] **F10-03-02** Con `FormControl` invalid + touched muestra el mensaje de error
- [ ] **F10-03-03** Con `FormControl` valid no muestra mensaje de error

**`fuel-selector.component.spec.ts`** (usa `HttpClientTestingModule`)
- [ ] **F10-03-04** Al inicializar llama a `GET /fuel-types` una sola vez
- [ ] **F10-03-05** Al seleccionar un `fuel_type` actualiza las opciones del select de unidad
- [ ] **F10-03-06** Emite `(fuelSelected)` con `{ fuelTypeId, unit }` al completar selección
- [ ] **F10-03-07** Si la llamada HTTP falla, muestra el select vacío sin lanzar excepción

**`sidebar-nav.component.spec.ts`**
- [ ] **F10-03-08** En estado expandido muestra los textos de los links de navegación
- [ ] **F10-03-09** Al hacer click en el toggle, `isCollapsed` signal cambia de `false` a `true`
- [ ] **F10-03-10** En estado colapsado no muestra textos de navegación (solo íconos)
- [ ] **F10-03-11** El link activo tiene la clase `routerLinkActive` aplicada

---

#### F10-04 — Tests: Feature Emisiones

**`emission-form.service.spec.ts`**
- [ ] **F10-04-01** El `FormGroup` inicial tiene todos los campos requeridos con valor vacío
- [ ] **F10-04-02** Campo `cantidad` con valor `0` → `FormControl` inválido (min: 0.01)
- [ ] **F10-04-03** Campo `cantidad` con valor `1000000` → `FormControl` inválido (max: 999999)
- [ ] **F10-04-04** Campo `fecha` con fecha futura → `FormControl` inválido (validador `maxDate`)
- [ ] **F10-04-05** `resetForm()` restaura todos los campos a su valor inicial
- [ ] **F10-04-06** Con todos los campos válidos, `form.valid` es `true`

**`emissions-api.service.spec.ts`** (usa `HttpClientTestingModule`)
- [ ] **F10-04-07** `getFuelTypes()` llama a `GET /fuel-types` y retorna el array de la respuesta
- [ ] **F10-04-08** `getPlants()` llama a `GET /plants` y retorna el array de la respuesta
- [ ] **F10-04-09** `createEmissionRecord(dto)` llama a `POST /emission-records` con el body correcto
- [ ] **F10-04-10** Si el servidor responde con error 422, el observable emite el error (no lo traga)

**`emission-form.component.spec.ts`** (usa `ReactiveFormsModule` + `HttpClientTestingModule`)
- [ ] **F10-04-11** El botón "Registrar" está deshabilitado si el formulario es inválido
- [ ] **F10-04-12** Al submit con form válido, llama a `EmissionsApiService.createEmissionRecord()`
- [ ] **F10-04-13** Durante el submit muestra el spinner en el botón
- [ ] **F10-04-14** Al recibir respuesta exitosa muestra `eco-badge success` con el tCO₂ calculado
- [ ] **F10-04-15** Al recibir error del API muestra `eco-badge danger` con mensaje de error

**`emission-list.component.spec.ts`** (usa `HttpClientTestingModule`)
- [ ] **F10-04-16** Muestra skeleton mientras carga
- [ ] **F10-04-17** Renderiza una fila por cada `EmissionRecord` en la lista
- [ ] **F10-04-18** Cada fila muestra el badge de estado correcto según `record.status`

---

#### F10-05 — Tests: Feature Dashboard

**`dashboard-api.service.spec.ts`** (usa `HttpClientTestingModule`)
- [ ] **F10-05-01** `getCompliance(plantId, month)` llama a `GET /dashboard/compliance` con los query params correctos
- [ ] **F10-05-02** `getTrend(plantId, month)` llama a `GET /dashboard/trend` con los query params correctos
- [ ] **F10-05-03** `getFuelBreakdown(plantId, month)` llama a `GET /dashboard/fuel-breakdown` con los query params correctos
- [ ] **F10-05-04** Si `PlantSelectorService.activePlant()` es `null`, el servicio no realiza llamadas HTTP

**`compliance-chart.component.spec.ts`**
- [ ] **F10-05-05** Muestra skeleton mientras `loading` es `true`
- [ ] **F10-05-06** Con datos donde tCO₂ < 80% del límite, el color de la barra es verde (`#16A34A`)
- [ ] **F10-05-07** Con datos donde tCO₂ ≥ 80% y < 100%, el color es ámbar (`#D97706`)
- [ ] **F10-05-08** Con datos donde tCO₂ ≥ 100%, el color es rojo (`#DC2626`)
- [ ] **F10-05-09** El chart renderiza el componente `apx-chart` en el DOM

**`dashboard-page.component.spec.ts`**
- [ ] **F10-05-10** Al cambiar el mes en el filtro, se re-llama a los 3 métodos del `DashboardApiService`
- [ ] **F10-05-11** Los 4 `eco-stat-card` reciben los valores correctos del response de compliance

---

#### F10-06 — Tests: Feature Auditoría

**`audit-api.service.spec.ts`** (usa `HttpClientTestingModule`)
- [ ] **F10-06-01** `getAuditList(params)` llama a `GET /emission-records` con los params de paginación y filtros
- [ ] **F10-06-02** `markAsAudited(id)` llama a `PATCH /emission-records/:id/audit`
- [ ] **F10-06-03** `exportRecords(params)` llama a `GET /emission-records/export` y retorna un `Blob`

**`audit-list.component.spec.ts`** (usa `HttpClientTestingModule`)
- [ ] **F10-06-04** Muestra skeleton en carga inicial
- [ ] **F10-06-05** Renderiza exactamente `N` filas según los registros del response
- [ ] **F10-06-06** Registros con `status: 'audited'` no muestran el botón "Marcar como Auditado"
- [ ] **F10-06-07** Registros con `status: 'pending'` muestran el botón "Marcar como Auditado"
- [ ] **F10-06-08** Sin acciones de editar/eliminar en el DOM (historial inmutable)

**`audit-actions.component.spec.ts`**
- [ ] **F10-06-09** Al click en "Marcar como Auditado" abre el `confirmation-dialog`
- [ ] **F10-06-10** Al confirmar en el dialog, llama a `AuditApiService.markAsAudited(id)`
- [ ] **F10-06-11** Al confirmar exitosamente, el badge de la fila cambia a `audited` sin recargar la tabla
- [ ] **F10-06-12** Al cancelar el dialog, no se llama a `markAsAudited`

**`audit-page.component.spec.ts`**
- [ ] **F10-06-13** El botón "Exportar" llama a `AuditApiService.exportRecords()`
- [ ] **F10-06-14** Durante la exportación el botón muestra estado loading
- [ ] **F10-06-15** Si exportRecords falla, el botón vuelve a estado normal y no lanza excepción no manejada

---

#### F10-07 — Configuración de Cobertura y Umbral Mínimo

- [ ] **F10-07-01** Configurar umbral de cobertura en `karma.conf.js`:
  ```js
  coverageReporter: {
    dir: 'coverage/',
    reporters: [{ type: 'html' }, { type: 'lcov' }, { type: 'text-summary' }],
    check: {
      global: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      }
    }
  }
  ```
- [ ] **F10-07-02** El script `npm test` en `package.json` ejecuta `ng test --watch=false --code-coverage`
- [ ] **F10-07-03** Verificar que `ng test` falla la build si la cobertura baja del 80% en alguna métrica
- [ ] **F10-07-04** Generar reporte HTML de cobertura en `frontend/coverage/` y verificar que supera 80% en:
  - [ ] Statements ≥ 80%
  - [ ] Branches ≥ 80%
  - [ ] Functions ≥ 80%
  - [ ] Lines ≥ 80%

---

#### Resumen de tests por fase

| Feature | Archivo spec | Tests | Cobertura objetivo |
|---|---|---|---|
| Core | `plant-selector.service.spec.ts` | 3 | 100% |
| Core | `api-client.service.spec.ts` | 2 | 90% |
| Átomos | `eco-button.spec.ts` | 5 | 100% |
| Átomos | `eco-badge.spec.ts` | 4 | 100% |
| Átomos | `eco-stat-card.spec.ts` | 3 | 100% |
| Shared | `form-control.spec.ts` | 3 | 100% |
| Shared | `fuel-selector.spec.ts` | 4 | 90% |
| Shared | `sidebar-nav.spec.ts` | 4 | 85% |
| Emisiones | `emission-form.service.spec.ts` | 6 | 100% |
| Emisiones | `emissions-api.service.spec.ts` | 4 | 90% |
| Emisiones | `emission-form.component.spec.ts` | 5 | 85% |
| Emisiones | `emission-list.component.spec.ts` | 3 | 85% |
| Dashboard | `dashboard-api.service.spec.ts` | 4 | 90% |
| Dashboard | `compliance-chart.component.spec.ts` | 5 | 85% |
| Dashboard | `dashboard-page.component.spec.ts` | 2 | 80% |
| Auditoría | `audit-api.service.spec.ts` | 3 | 90% |
| Auditoría | `audit-list.component.spec.ts` | 5 | 85% |
| Auditoría | `audit-actions.component.spec.ts` | 4 | 90% |
| Auditoría | `audit-page.component.spec.ts` | 3 | 85% |
| **Total** | **19 archivos** | **~72 casos** | **≥ 80% global** |

---

## 5. Resumen de Dependencias

| Paquete | Versión mínima | Propósito |
|---|---|---|
| `ng-apexcharts` | `^1.x` | Wrapper Angular de ApexCharts |
| `apexcharts` | `^3.x` | Motor de charts |
| `lucide-angular` | `^0.x` | Íconos SVG (sin emojis) |
| `tailwindcss` | `^4.x` | Ya instalado |
| `@angular/forms` | `^21.x` | Ya instalado — `ReactiveFormsModule` |
| `@angular/common/http` | `^21.x` | Ya instalado — `HttpClient` |
| `karma` | `^6.x` | Runner de tests |
| `karma-chrome-launcher` | `^3.x` | Ejecutar en ChromeHeadless |
| `karma-jasmine` | `^5.x` | Framework Jasmine para Karma |
| `karma-coverage` | `^2.x` | Reporte de cobertura |
| `jasmine-core` | `^5.x` | Core de Jasmine |
| `@types/jasmine` | `^5.x` | Tipos TypeScript para Jasmine |

---

*Este plan está listo para implementación una vez aprobado.*
