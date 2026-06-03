//1 - Importação de módulos e configuração do Prisma Client
import "dotenv/config";
import express from "express";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error(
        "DATABASE_URL não está definida. Verifique o arquivo .env."
    );
}

//2 - Configuração do servidor Express e rotas para manipulação de filmes
const port = Number(process.env.PORT ?? 3000);
const app = express();
app.use(express.json());

// Middleware para capturar erros de JSON inválido enviados no corpo da requisição
app.use((err: any, req: any, res: any, next: any) => {
    if (err && err.type === "entity.parse.failed") {
        return res
            .status(400)
            .json({ error: "JSON inválido no corpo da requisição" });
    }
    next(err);
});

const adapter = new PrismaPg({
    connectionString,
});
const prisma = new PrismaClient({
    adapter,
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//3 - Rotas para manipulação de filmes
app.get("/", (_, res) => {
    res.send("Servidor MovieFlix funcionando");
});
//7 - Rota para listar todos os filmes, ordenados por título e incluindo informações de gênero e idioma
app.get("/movies", async (req, res) => {
    const movies = await prisma.movies.findMany({
        //ORDENAR POR TITULO
        orderBy: {
            title: "asc",
        },
        //INCLUIR GÊNERO E IDIOMA
        include: {
            genres: true,
            languages: true,
        },
    });
    res.json(movies);
});
//8 - Rota para criar um novo filme, verificando se já existe um filme com o mesmo título (case-insensitive)
app.post("/movies", async (req, res) => {
    const { title, genre_id, language_id, oscar_count, release_date } =
        req.body;

    try {
        // Verificar se já existe um filme com o mesmo título (case-insensitive)
        const movieWithSameTitle = await prisma.movies.findFirst({
            where: {
                title: { equals: title, mode: "insensitive" },
            },
        });

        if (movieWithSameTitle) {
            return res.status(409).send({
                message: "Já existe um filme cadastrado com esse título",
            });
        }
        // Criar o novo filme/cadastrar o novo filme
        await prisma.movies.create({
            data: {
                title,
                genre_id,
                language_id,
                oscar_count,
                release_date: new Date(release_date),
            },
        });
        res.status(201).send("Filme criado com sucesso");
    } catch (error) {
        return res.status(500).send({ message: "Erro ao criar filme" });
    }
});

//9 - Rota para atualizar um filme existente, verificando se o filme existe e se o novo título não conflita com outro filme (case-insensitive)
app.put("/movies/:id", async (req, res) => {
    //pegar o id do registro que vai ser atualizado
    const id = Number(req.params.id);
    //tratando o erro: caso o filme não exista retornar um erro
    try {
        const movie = await prisma.movies.findUnique({
            where: {
                id,
            },
        });
        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" });
        }

        //pegando todos os dados que foram alterados no body da requisição
        const data = { ...req.body };
        //transformar a data de string para Date(caso tenha data no projeto)
        data.release_date = data.release_date
            ? new Date(data.release_date)
            : undefined;

        //pegar os dados do filme que será atualizado e atualizar ele no prisma
        await prisma.movies.update({
            where: {
                id,
            },
            data: data,
        });
    } catch (error) {
        return res.status(500).send({ message: "Erro ao atualizar filme" });
    }

    //retornar o status correto informando que o filme foi atualizado
    res.status(200).send("Filme atualizado com sucesso");
});

//10 - Rota para excluir um filme existente, verificando se o filme existe antes de tentar excluí-lo
app.delete("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);
    ///tratando o erro
    try {
        // Verificar se o filme existe antes de tentar excluí-lo
        const movie = await prisma.movies.findUnique({
            where: {
                id,
            },
        });

        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" });
        }

        // Excluir o filme

        await prisma.movies.delete({ where: { id } });
    } catch (error) {
        return res.status(500).send({ message: "Erro ao excluir filme" });
    }

    res.status(200).send({ message: "Filme excluído com sucesso" });
});

//11 - Rota para filtrar filmes por genero
app.get("/movies/genre/:genreName", async (req, res) => {
    //receber o nome do gênero pelo parâmetro da rota
    try {
        //filtrar os filmes do banco pelo gênero
        const moviesFilteredByGenreName = await prisma.movies.findMany({
            include: {
                genres: true,
                languages: true,
            },
            where: {
                genres: {
                    name: {
                        equals: req.params.genreName,
                        mode: "insensitive",
                    },
                },
            },
        });
        //retornar os filmes filtrados na resposta da rota
        res.status(200).send(moviesFilteredByGenreName);
    } catch (error) {
        res.status(500).send({ message: "Erro ao filtrar filmes por gênero" });
    }
});
//4 - Iniciar o servidor Express
app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
});
