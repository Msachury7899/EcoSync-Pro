npm i @prisma/client @types/swagger-jsdoc bcryptjs compression cors dotenv  env-var errorhandler express helmet jsonwebtoken swagger-jsdoc swagger-ui-express tsconfig-paths ulid zod

npm i -D @types/compression @types/cors @types/errorhandler @types/express @types/jest @types/jsonwebtoken @types/node @types/supertest @types/swagger-ui-express dotenv-cli esbuild glob jest prisma rimraf supertest ts-jest ts-node-dev typescript



- para mejorar

incluir 
usuarios_certificaciones
compras
examenes
planes


# Monolito (default)
docker build -t odin-api .

# Microservicio específico — solo cambia el arg
docker build --build-arg SERVICE_NAME=jobs -t odin-jobs .
docker build --build-arg SERVICE_NAME=study-areas -t odin-study-areas .




open(CertificationDeleteModal, { certification: cert, onConfirm: async () => remove(cert.id) });
open(CertificationFormModal,   { editing: cert,         onSubmit: async (dto) => update(cert.id, dto) });


open(ModalConfirmDelete, {
  itemName: user.name,
  warningText: 'Se perderán todos sus datos.',
  onConfirm: async () => remove(user.id),
});