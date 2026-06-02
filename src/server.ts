//1 - Importação de módulos e configuração do Prisma Client
import "dotenv/config";
import express from "express";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
!connectionString;

//2 - Configuração do servidor Express e rotas para manipulação de filmes
const port = 3000;
const app = express();
const adapter = new PrismaPg({
    connectionString,
});
const prisma = new PrismaClient({
    adapter,
});

app.use(express.json());

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
            return res
                .status(409)
                .send({
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

//4 - Iniciar o servidor Express
app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
});
