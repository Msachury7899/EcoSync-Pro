Pasos para ejecutar la solucion 

1. Configurar .env en deploy 
2. Tener una instancia de postgress levantada
3. Ejecutar el siguiente orden de comandos
  - cd davi-engine-co2 && npm install && npm run drizzle:migrate && npm run dev
  - cd frontend && npm install && npm run start
4. Abrir visual studio 2026 o abrir solucion en davi-bff 
  - restaurar proyecto
  - ejecutar proyecto




# COMANDOS COVERAGE
 Engine:  npm run test:coverage
 BFF: ng test --no-watch --code-coverage
 Frontend: npm run 
