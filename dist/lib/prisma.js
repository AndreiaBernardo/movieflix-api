//6 - Configuração do Prisma Client e definição do modelo de dados para filmes, gêneros e idiomas
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({
    adapter,
});
export default prisma;
//# sourceMappingURL=prisma.js.map