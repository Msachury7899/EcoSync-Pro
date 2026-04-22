# Plan de Implementación Frontend — EcoSync
> Estado: **PENDIENTE DE APROBACIÓN**  
> Generado con: `ui-ux-pro-max v2.5.0`  
> Fecha: 22 de abril de 2026  
> Stack: Angular 21 + Tailwind CSS 4

---

## 1. Design System (Fuente de verdad visual)

> Derivado de `ui-ux-pro-max` → query: `industrial monitoring dashboard carbon emissions sustainability SaaS professional dark`

### 1.1 Estilo General
| Atributo | Decisión | Justificación |
|---|---|---|
| Modo | **Dark Mode (OLED)** | Dashboard industrial de monitoreo — uso intensivo, bajo estrés visual, WCAG AAA |
| Patrón Layout | **Sidebar fijo + Área de contenido** | SaaS de gestión; navegación persistente recomendada para apps de datos |
| Densidad | Media-alta | Alta densidad de información sin sacrificar lectura |

### 1.2 Paleta de Colores

| Token | Hex | Uso |
|---|---|---|
| `--color-bg-base` | `#020617` | Fondo general (slate-950) |
| `--color-bg-surface` | `#0F172A` | Tarjetas y paneles (slate-900) |
| `--color-bg-elevated` | `#1E293B` | Inputs, rows hover (slate-800) |
| `--color-primary` | `#22C55E` | CTA, indicadores positivos, "OK" (green-500) |
| `--color-warning` | `#F59E0B` | Próximo al límite (amber-400) |
| `--color-danger` | `#EF4444` | Por encima del límite (red-500) |
| `--color-text-primary` | `#F8FAFC` | Texto principal (slate-50) |
| `--color-text-muted` | `#94A3B8` | Texto secundario (slate-400) |
| `--color-border` | `#334155` | Bordes de componentes (slate-700) |
| `--color-audited` | `#38BDF8` | Badge "Auditado" (sky-400) |

> **Anti-patrón a evitar:** actualizaciones lentas sin feedback. Toda operación async > 300ms debe mostrar skeleton/spinner.

### 1.3 Tipografía
| Rol | Fuente | Pesos | Importación |
|---|---|---|---|
| Headings | **Plus Jakarta Sans** | 600, 700 | Google Fonts |
| Body / UI | **Plus Jakarta Sans** | 300, 400, 500 | Google Fonts |

```css
/* En styles.css global */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
```

### 1.4 Efectos e Interacciones
| Efecto | Regla |
|---|---|
| Transiciones | `150ms–300ms ease` en todos los hover/focus |
| Glow sutil | `text-shadow: 0 0 10px #22C55E40` en métricas clave |
| Focus visible | Ring verde `ring-2 ring-primary` — navegación por teclado |
| `prefers-reduced-motion` | Desactivar animaciones si el sistema lo solicita |
| Hover en rows | `bg-elevated` sin desplazamiento |

---

## 2. Librería de Charts

> Seleccionada por `ui-ux-pro-max` → domain: `chart`

**Decisión: [ng-apexcharts](https://apexcharts.com/docs/angular-charts/) (ApexCharts para Angular)**

| Criterio | Evaluación |
|---|---|
| Soporte Angular | ✅ Wrapper oficial `ng-apexcharts` |
| Chart tipo Bar con línea de referencia (límite) | ✅ `annotations.yaxis` |
| Dark mode nativo | ✅ `theme: { mode: 'dark' }` |
| Responsive out-of-the-box | ✅ |
| Sin dependencias pesadas adicionales | ✅ |

**Charts a implementar:**

| Feature | Tipo de Chart | Descripción |
|---|---|---|
| Dashboard de Cumplimiento | **Grouped Bar Chart** | Barras mensuales de tCO₂ real + línea de anotación horizontal = límite mensual de la planta |
| Dashboard — tendencia | **Smooth Area Chart** | Evolución diaria de emisiones (último mes) |
| Dashboard — distribución | **Donut Chart** | % por tipo de combustible del mes actual |

---

## 3. Arquitectura de la Aplicación

### 3.1 Atomic Design — Estructura de Carpetas

```
frontend/src/app/
├── core/
│   ├── interceptors/
│   │   └── http-auth.interceptor.ts       # Header Authorization
│   ├── services/
│   │   └── api-client.service.ts          # HttpClient base
│   └── models/
│       └── api-response.model.ts          # Tipo genérico ApiResponse<T>
│
├── shared/
│   └── components/
│       ├── atoms/
│       │   ├── button/                    # <eco-button>
│       │   ├── badge/                     # <eco-badge> (pending/audited)
│       │   ├── input-field/               # <eco-input>
│       │   ├── select-field/              # <eco-select>
│       │   ├── spinner/                   # <eco-spinner>
│       │   └── stat-card/                 # <eco-stat-card> (KPI tile)
│       ├── molecules/
│       │   ├── form-control/              # label + input + error message
│       │   ├── fuel-selector/             # select de fuel_type + unidad
│       │   └── confirmation-dialog/       # modal de confirmación
│       └── organisms/
│           ├── page-header/               # título + breadcrumb
│           └── sidebar-nav/               # navegación lateral fija
│
└── features/
    ├── emissions/                         # Feature 1
    │   ├── components/
    │   │   ├── emission-form/             # Formulario dinámico (organism)
    │   │   └── emission-list/             # Tabla de registros
    │   ├── services/
    │   │   ├── emissions-api.service.ts   # Calls al backend
    │   │   └── emission-form.service.ts   # Lógica del formulario reactivo
    │   ├── models/
    │   │   └── emission-record.model.ts
    │   └── emissions.routes.ts            # Lazy route con providers
    │
    ├── dashboard/                         # Feature 3
    │   ├── components/
    │   │   ├── compliance-chart/          # Bar chart vs límite (organism)
    │   │   ├── trend-chart/               # Area chart diario
    │   │   └── fuel-breakdown-chart/      # Donut chart
    │   ├── services/
    │   │   └── dashboard-api.service.ts
    │   ├── models/
    │   │   └── dashboard-metrics.model.ts
    │   └── dashboard.routes.ts
    │
    └── audit/                             # Feature 4
        ├── components/
        │   ├── audit-list/               # Tabla historial inmutable
        │   └── audit-actions/            # Botón "Marcar como auditado"
        ├── services/
        │   └── audit-api.service.ts
        ├── models/
        │   └── audit-record.model.ts
        └── audit.routes.ts
```

### 3.2 Inyección de Dependencias mediante `providers`

Los servicios **no serán `providedIn: 'root'`** — se inyectarán por feature para mantener aislamiento:

```typescript
// emissions.routes.ts
export const emissionsRoutes: Routes = [{
  path: '',
  component: EmissionsPageComponent,
  providers: [
    EmissionsApiService,
    EmissionFormService,
  ]
}];
```

```typescript
// app.routes.ts (lazy loading)
export const routes: Routes = [
  { path: 'emissions', loadChildren: () => import('./features/emissions/emissions.routes') },
  { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes') },
  { path: 'audit',     loadChildren: () => import('./features/audit/audit.routes') },
  { path: '',          redirectTo: '/dashboard', pathMatch: 'full' },
];
```

> **Patrón:** Lazy routes + `providers[]` en ruta = scoped DI sin overhead de root injector.

---

## 4. Detalle por Feature

### Feature 1 — Registro de Emisiones

**Ruta:** `/emissions`

| Aspecto | Decisión |
|---|---|
| Formulario | `ReactiveFormsModule` con `FormGroup` + `FormArray` para múltiples combustibles |
| Validaciones | `onBlur` para campos simples, `valueChanges` + `debounceTime(300)` para campo Cantidad |
| Tipos dinámicos | `fuel-selector` molecule carga `GET /fuel-types` al montar (signal-based) |
| Unidades | Se despliegan según el fuel_type seleccionado (select dependiente) |
| Submit feedback | Spinner en botón → badge de éxito/error inline (no toast flotante) |
| Errores en tiempo real | Mensajes bajo cada field: "Requerido", "Debe ser > 0", "Unidad inválida" |

**Campos del formulario:**
```
Planta (select)          → required
Fecha                    → date, required, no futura
Combustible (select)     → required, carga desde API
Cantidad (number)        → required, min: 0.01, max: 999999
Unidad (select)          → depende del combustible, required
```

---

### Feature 2 — Motor de Cálculo CO₂ (API)

> Esta feature vive en el **backend** (`davi-engine-co2`). El frontend solo consume el resultado.  
> El formulario de emisiones llamará a `POST /emission-records` que internamente aplica el factor.  
> La respuesta incluirá `tco2_calculated` y se mostrará como confirmación al usuario.

---

### Feature 3 — Dashboard de Cumplimiento

**Ruta:** `/dashboard`

| Componente | Chart | Datos |
|---|---|---|
| `compliance-chart` | **Bar Chart vertical** + anotación horizontal de límite | `GET /dashboard/compliance?plant=X&month=Y` |
| `trend-chart` | **Smooth Area Chart** (eje X = días del mes) | `GET /dashboard/trend?plant=X&month=Y` |
| `fuel-breakdown-chart` | **Donut Chart** | `GET /dashboard/fuel-breakdown?plant=X&month=Y` |

**Lógica de colores semánticos en la barra:**
- `tCO₂ < 80% del límite` → `#22C55E` (verde)
- `80% ≤ tCO₂ < 100%` → `#F59E0B` (ámbar — alerta)
- `tCO₂ ≥ 100%` → `#EF4444` (rojo — incumplimiento)

**Selector de planta y mes:**  
Filtros superiores (select + month picker) que disparan re-fetch con signals + `rxjs`.

---

### Feature 4 — Exportación y Auditoría

**Ruta:** `/audit`

| Subfeature | Detalle |
|---|---|
| **Marcar como Auditado** | Botón en cada row → `PATCH /emission-records/:id/audit` → badge cambia a "Auditado" (sky-400) |
| **Historial inmutable** | Tabla de solo lectura — sin acciones de editar/eliminar |
| **Columnas de la tabla** | Fecha, Planta, Combustible, Cantidad, Unidad, tCO₂, Estado, Auditado por, Fecha auditoría |
| **Exportación** | Botón "Exportar CSV/PDF" → llama `GET /emission-records/export` (implementado en backend) — solo trigger, el frontend descarga el blob |
| **Paginación** | Server-side pagination (`page` + `limit` en query params) |

**Badge de estado:**
```
pending  → "Pendiente"  → bg amber-900/30 + text amber-400
audited  → "Auditado"   → bg sky-900/30   + text sky-400
```

---

## 5. Convenciones de Código Angular

| Regla | Detalle |
|---|---|
| **Signals** | Usar `signal()`, `computed()`, `effect()` de Angular 17+ para estado local de componentes |
| **OnPush** | `ChangeDetectionStrategy.OnPush` en todos los componentes |
| **Standalone** | Todos los componentes son `standalone: true` |
| **Imports** | Solo importar lo necesario por componente (no módulos generales) |
| **Nomenclatura** | `eco-` como prefijo de componentes (`eco-button`, `eco-badge`) |
| **Archivos** | `kebab-case.component.ts`, `kebab-case.service.ts` |
| **HTTP** | `HttpClient` con `httpResource` (Angular 21) o `toSignal(this.http.get(...))` |
| **Estilos** | Tailwind utilities inline — no CSS custom salvo tokens en `:root` |

---

## 6. Checklist Pre-Entrega (ui-ux-pro-max)

- [ ] Sin emojis como iconos — usar **Lucide Icons** (`lucide-angular`)
- [ ] `cursor-pointer` en todos los elementos clicables
- [ ] Transiciones `150–300ms ease` en hover/focus
- [ ] Contraste de texto ≥ 4.5:1 (WCAG AA)
- [ ] `focus-visible` visible para navegación por teclado
- [ ] `prefers-reduced-motion` respetado (desactivar animaciones)
- [ ] Responsivo en: `375px`, `768px`, `1024px`, `1440px`
- [ ] Skeleton loaders en carga inicial de charts y tablas
- [ ] Validación inline en formularios (`onBlur` + `valueChanges`)
- [ ] Feedback de submit: loading → success/error

---

## 7. Dependencias a Instalar

```bash
# Charts
npm install ng-apexcharts apexcharts

# Íconos
npm install lucide-angular
```

> Tailwind CSS 4 ya está instalado. No se requiere configuración adicional de `tailwind.config.js` (versión 4 usa CSS-first).

---

## 8. Fases de Implementación

| Fase | Contenido | Prioridad |
|---|---|---|
| **F0** | Estructura de carpetas + tokens CSS en `styles.css` + tipografía | Bloqueante |
| **F1** | Átomos: `eco-button`, `eco-badge`, `eco-input`, `eco-select`, `eco-spinner`, `eco-stat-card` | Alta |
| **F2** | Moléculas: `form-control`, `fuel-selector` + Organismos: `sidebar-nav`, `page-header` | Alta |
| **F3** | Feature Emissions: formulario reactivo + integración API | Alta |
| **F4** | Feature Dashboard: 3 charts + filtros de planta/mes | Alta |
| **F5** | Feature Audit: tabla historial + acción "marcar auditado" + exportar | Media |

---

## 9. Decisiones Abiertas (requieren aprobación)

| # | Decisión | Opciones | Recomendación |
|---|---|---|---|
| D1 | ¿Se incluye **modo claro** (light mode toggle)? | Sí / No | No — solo dark mode (plataforma industrial) |
| D2 | ¿La navegación lateral es **colapsable**? | Sí / No | Sí — icon-only en móvil |
| D3 | ¿El selector de planta en Dashboard es **global** (persiste entre páginas)? | Sí / No | Sí — via signal en `core/services` |
| D4 | ¿Se implementa **autenticación** (Firebase Auth) en este sprint? | Sí / No | No — interceptor preparado pero sin guard activo |

---

*Este documento debe ser aprobado antes de iniciar la implementación (Feature F0).*
