# BFF API — Contrato de Endpoints para EcoSync Frontend
> Proyecto: `davi-bff-api` (.NET 8)  
> Base URL: `/api/v1`  
> Motor downstream: `davi-engine-co2` → `{ENGINE_URL}/api/v1/emissions`

---

## Contexto de la capa BFF

El BFF no es un simple proxy. Su responsabilidad es:

| Responsabilidad | Detalle |
|---|---|
| **Proxy + reshape** | Reenvía llamadas al engine y adapta la respuesta al shape que necesita el frontend |
| **Agregación** | Los endpoints de dashboard componen múltiples queries sobre los datos del motor |
| **Completar gaps** | El engine no expone `plants`, `export` ni `dashboard` — el BFF los provee |
| **Paginación** | El engine no pagina registros — el BFF añade `page` / `limit` / `totalCount` |
| **Filtro por planta** | El engine no filtra por `plantId` — el BFF añade ese parámetro |

---

## Grupo 1 — Plantas (`/plants`)

> El engine tiene entidad `Plant` y use cases pero no expone rutas. El BFF llama directamente a la DB o expone un proxy sobre un futuro endpoint del engine.

### `GET /api/v1/plants`
Lista todas las plantas disponibles para el selector global.

**Response `200`**
```json
[
  {
    "id": "01HZ...",
    "name": "Planta Norte",
    "monthlyLimitTco2": 150.0,
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

### `GET /api/v1/plants/:id`
Detalle de una planta (incluye `monthlyLimitTco2` para las anotaciones del chart).

**Response `200`**
```json
{
  "id": "01HZ...",
  "name": "Planta Norte",
  "monthlyLimitTco2": 150.0,
  "createdAt": "2026-01-01T00:00:00Z"
}
```

---

## Grupo 2 — Tipos de Combustible (`/fuel-types`)

> Proxy directo a `davi-engine-co2 → GET /api/v1/emissions/fuel-types`

### `GET /api/v1/fuel-types`
Lista todos los tipos de combustible activos. Alimenta el `fuel-selector` en el formulario.

**Response `200`**
```json
[
  {
    "id": "01HZ...",
    "name": "Diesel",
    "description": "Combustible líquido de destilación media",
    "units": ["litros", "galones"],
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

> **Nota:** El engine retorna `FuelType` sin el campo `units`. El BFF agrega el arreglo de unidades válidas según los `EmissionFactor` activos para ese `fuelTypeId`.

### `GET /api/v1/fuel-types/:id`
Detalle de un tipo de combustible.

---

## Grupo 3 — Registros de Emisión (`/emission-records`)

> Proxy al engine con extensiones: filtro por `plantId`, paginación y endpoint de exportación.

### `POST /api/v1/emission-records`
Crea un nuevo registro. El engine calcula `tco2Calculated` y `factorSnapshot` internamente.

**Request body**
```json
{
  "plantId": "01HZ...",
  "fuelTypeId": "01HZ...",
  "quantity": 250.5,
  "unit": "litros",
  "recordedDate": "2026-04-22T00:00:00Z",
  "notes": "Turno mañana"
}
```

**Response `201`**
```json
{
  "id": "01HZ...",
  "plantId": "01HZ...",
  "plantName": "Planta Norte",
  "fuelTypeId": "01HZ...",
  "fuelTypeName": "Diesel",
  "quantity": 250.5,
  "unit": "litros",
  "factorSnapshot": 2.68,
  "tco2Calculated": 0.671,
  "status": "pending",
  "recordedDate": "2026-04-22T00:00:00Z",
  "notes": "Turno mañana",
  "createdAt": "2026-04-22T10:00:00Z",
  "updatedAt": "2026-04-22T10:00:00Z"
}
```

> **Nota:** El BFF enriquece la respuesta del engine con `plantName` y `fuelTypeName` para evitar lookups adicionales en el frontend.

---

### `GET /api/v1/emission-records`
Lista registros con filtros y paginación server-side.

**Query params**
| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `plantId` | `string` | No | Filtrar por planta |
| `status` | `pending \| audited` | No | Filtrar por estado |
| `fromDate` | `ISO 8601` | No | Fecha desde |
| `toDate` | `ISO 8601` | No | Fecha hasta |
| `page` | `number` | No (default: 1) | Página actual |
| `limit` | `number` | No (default: 20) | Registros por página |

**Response `200`**
```json
{
  "data": [ /* array de EmissionRecord enriquecido */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 87,
    "totalPages": 5
  }
}
```

---

### `GET /api/v1/emission-records/:id`
Detalle de un registro.

**Response `200`** — mismo shape que `POST /emission-records` response.

---

### `PATCH /api/v1/emission-records/:id/audit`
Marca un registro como auditado (cambia `status: pending → audited`).

**Request body** — vacío o con campo opcional:
```json
{
  "auditedBy": "operador@ecosync.com"
}
```

**Response `200`** — registro actualizado con `status: "audited"` y `auditedAt`.

---

### `GET /api/v1/emission-records/:id/history`
Historial inmutable de cambios de estado de un registro.

**Response `200`**
```json
[
  {
    "id": "01HZ...",
    "emissionRecordId": "01HZ...",
    "action": "created",
    "previousStatus": null,
    "newStatus": "pending",
    "changedBy": null,
    "metadata": null,
    "createdAt": "2026-04-22T10:00:00Z"
  },
  {
    "id": "01HZ...",
    "emissionRecordId": "01HZ...",
    "action": "audited",
    "previousStatus": "pending",
    "newStatus": "audited",
    "changedBy": "operador@ecosync.com",
    "metadata": null,
    "createdAt": "2026-04-22T11:30:00Z"
  }
]
```

---

### `GET /api/v1/emission-records/export`
Genera y descarga un archivo de exportación.

**Query params**
| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `plantId` | `string` | No | Filtrar por planta |
| `status` | `pending \| audited` | No | Filtrar por estado |
| `fromDate` | `ISO 8601` | No | Fecha desde |
| `toDate` | `ISO 8601` | No | Fecha hasta |
| `format` | `csv \| pdf` | No (default: `csv`) | Formato de exportación |

**Response `200`**
```
Content-Type: text/csv  (o application/pdf)
Content-Disposition: attachment; filename="emissions-export-2026-04.csv"
```

> El frontend hace `window.open(url)` o descarga el blob. La lógica de generación vive íntegramente en el BFF.

---

## Grupo 4 — Dashboard (`/dashboard`)

> Endpoints de **solo lectura** exclusivos del BFF. No existen en el engine. El BFF ejecuta las queries de agregación sobre los datos del motor.

### `GET /api/v1/dashboard/compliance`
Datos para el **Bar Chart de cumplimiento mensual** — tCO₂ real vs límite por mes.

**Query params**
| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `plantId` | `string` | **Sí** | Planta a consultar |
| `year` | `number` | **Sí** | Año (ej: 2026) |

**Response `200`**
```json
{
  "plantId": "01HZ...",
  "plantName": "Planta Norte",
  "monthlyLimitTco2": 150.0,
  "months": [
    { "month": 1, "label": "Ene", "tco2Real": 98.4,  "percentOfLimit": 65.6, "status": "ok" },
    { "month": 2, "label": "Feb", "tco2Real": 127.1, "percentOfLimit": 84.7, "status": "warning" },
    { "month": 3, "label": "Mar", "tco2Real": 162.3, "percentOfLimit": 108.2,"status": "exceeded" },
    { "month": 4, "label": "Abr", "tco2Real": 54.2,  "percentOfLimit": 36.1, "status": "ok" }
  ]
}
```

> `status`: `ok` = < 80% · `warning` = 80–99% · `exceeded` = ≥ 100%

---

### `GET /api/v1/dashboard/trend`
Datos para el **Smooth Area Chart** — tCO₂ acumuladas por día en un mes.

**Query params**
| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `plantId` | `string` | **Sí** | Planta a consultar |
| `month` | `YYYY-MM` | **Sí** | Mes (ej: `2026-04`) |

**Response `200`**
```json
{
  "plantId": "01HZ...",
  "month": "2026-04",
  "monthlyLimitTco2": 150.0,
  "days": [
    { "date": "2026-04-01", "tco2": 3.2 },
    { "date": "2026-04-02", "tco2": 5.8 },
    { "date": "2026-04-22", "tco2": 54.2 }
  ]
}
```

---

### `GET /api/v1/dashboard/fuel-breakdown`
Datos para el **Donut Chart** — distribución de tCO₂ por tipo de combustible en un mes.

**Query params**
| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `plantId` | `string` | **Sí** | Planta a consultar |
| `month` | `YYYY-MM` | **Sí** | Mes (ej: `2026-04`) |

**Response `200`**
```json
{
  "plantId": "01HZ...",
  "month": "2026-04",
  "totalTco2": 54.2,
  "breakdown": [
    { "fuelTypeId": "01HZ...", "fuelTypeName": "Diesel",       "tco2": 31.8, "percentage": 58.7 },
    { "fuelTypeId": "01HZ...", "fuelTypeName": "Gas Natural",  "tco2": 14.2, "percentage": 26.2 },
    { "fuelTypeId": "01HZ...", "fuelTypeName": "Carbón",       "tco2":  8.2, "percentage": 15.1 }
  ]
}
```

---

### `GET /api/v1/dashboard/summary`
KPIs para los 4 `eco-stat-card` del header del dashboard.

**Query params**
| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `plantId` | `string` | **Sí** | Planta a consultar |
| `month` | `YYYY-MM` | **Sí** | Mes (ej: `2026-04`) |

**Response `200`**
```json
{
  "plantId": "01HZ...",
  "month": "2026-04",
  "totalTco2": 54.2,
  "monthlyLimitTco2": 150.0,
  "percentOfLimit": 36.1,
  "totalRecords": 12,
  "remainingDays": 8,
  "status": "ok"
}
```

---

## Resumen de endpoints

| Método | Ruta | Origen | Feature frontend |
|---|---|---|---|
| `GET` | `/api/v1/plants` | BFF propio | Selector global de planta |
| `GET` | `/api/v1/plants/:id` | BFF propio | — |
| `GET` | `/api/v1/fuel-types` | Proxy → engine | Formulario emisiones |
| `GET` | `/api/v1/fuel-types/:id` | Proxy → engine | — |
| `POST` | `/api/v1/emission-records` | Proxy → engine + enrich | Formulario emisiones |
| `GET` | `/api/v1/emission-records` | Proxy → engine + paginación + plantId | Lista emisiones, Auditoría |
| `GET` | `/api/v1/emission-records/:id` | Proxy → engine | — |
| `PATCH` | `/api/v1/emission-records/:id/audit` | Proxy → engine | Auditoría — marcar auditado |
| `GET` | `/api/v1/emission-records/:id/history` | Proxy → engine | Historial inmutable |
| `GET` | `/api/v1/emission-records/export` | BFF propio | Auditoría — exportar |
| `GET` | `/api/v1/dashboard/compliance` | BFF propio (agregación) | Dashboard — Bar Chart |
| `GET` | `/api/v1/dashboard/trend` | BFF propio (agregación) | Dashboard — Area Chart |
| `GET` | `/api/v1/dashboard/fuel-breakdown` | BFF propio (agregación) | Dashboard — Donut Chart |
| `GET` | `/api/v1/dashboard/summary` | BFF propio (agregación) | Dashboard — KPI cards |

**Total: 14 endpoints · 4 grupos**
