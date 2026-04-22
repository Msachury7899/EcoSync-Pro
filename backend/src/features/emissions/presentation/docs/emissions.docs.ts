/**
 * @swagger
 * tags:
 *   - name: Fuel Types
 *     description: Catálogo de tipos de combustible
 *   - name: Emission Factors
 *     description: Factores de conversión configurables (kgCO2/unidad)
 *   - name: Emission Records
 *     description: Registro de consumo y motor de cálculo de CO2
 */

/**
 * @swagger
 * /api/v1/emissions/fuel-types:
 *   post:
 *     tags: [Fuel Types]
 *     summary: Crear tipo de combustible
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tipo de combustible creado
 *       400:
 *         description: Validación fallida
 *       409:
 *         description: Ya existe un tipo con ese nombre
 *   get:
 *     tags: [Fuel Types]
 *     summary: Listar tipos de combustible
 *     responses:
 *       200:
 *         description: Lista de tipos de combustible
 */

/**
 * @swagger
 * /api/v1/emissions/fuel-types/{id}:
 *   get:
 *     tags: [Fuel Types]
 *     summary: Obtener tipo de combustible por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tipo de combustible
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/v1/emissions/emission-factors:
 *   post:
 *     tags: [Emission Factors]
 *     summary: Crear factor de conversión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fuelTypeId, factorKgco2PerUnit, unit, effectiveFrom]
 *             properties:
 *               fuelTypeId:
 *                 type: string
 *               factorKgco2PerUnit:
 *                 type: number
 *                 description: Factor en kgCO2 por unidad
 *               unit:
 *                 type: string
 *                 example: litro
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Factor creado
 *       400:
 *         description: Validación fallida o fuelTypeId inválido
 *   get:
 *     tags: [Emission Factors]
 *     summary: Listar factores de conversión
 *     responses:
 *       200:
 *         description: Lista de factores
 */

/**
 * @swagger
 * /api/v1/emissions/emission-factors/{id}:
 *   get:
 *     tags: [Emission Factors]
 *     summary: Obtener factor de conversión por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Factor de conversión
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/v1/emissions/records:
 *   post:
 *     tags: [Emission Records]
 *     summary: Registrar consumo y calcular tCO2
 *     description: Aplica el factor de conversión vigente para la fecha indicada. tCO2 = (cantidad × factor) / 1000. Genera entrada de historial inmutable.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fuelTypeId, quantity, unit, recordedDate]
 *             properties:
 *               fuelTypeId:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               recordedDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registro creado con tco2Calculated
 *       400:
 *         description: Sin factor vigente para la fecha o validación fallida
 *   get:
 *     tags: [Emission Records]
 *     summary: Listar registros de emisión
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, audited]
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Lista de registros
 */

/**
 * @swagger
 * /api/v1/emissions/records/{id}:
 *   get:
 *     tags: [Emission Records]
 *     summary: Obtener registro de emisión por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registro de emisión
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/v1/emissions/records/{id}/audit:
 *   patch:
 *     tags: [Emission Records]
 *     summary: Marcar registro como auditado
 *     description: Transición pending → audited. Genera entrada de historial inmutable.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registro auditado
 *       404:
 *         description: No encontrado
 *       409:
 *         description: Ya estaba auditado
 */

/**
 * @swagger
 * /api/v1/emissions/records/{id}/history:
 *   get:
 *     tags: [Emission Records]
 *     summary: Historial inmutable del registro
 *     description: Retorna todos los eventos del registro en orden cronológico. Append-only — nunca se modifica.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de eventos del historial
 */
