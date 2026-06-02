import "dotenv/config";
import express from "express";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
!connectionString;

const port = 3000;
const app = express();
const adapter = new PrismaPg({
    connectionString,
});
const prisma = new PrismaClient({
    adapter,
});

app.use(express.json());

app.get("/", (_, res) => {
    res.send("Servidor MovieFlix funcionando");
});

app.get("/movies", async (req, res) => {
    const movies = await prisma.movies.findMany({
        orderBy: {
            title: "asc",
        },
        include: {
            genres: true,
            languages: true,
        },
    });
    res.json(movies);
});

app.post("/movies", async (req, res) => {
    const { title, genre_id, language_id, oscar_count, release_date } = req.body;

    try {

        const movieWithSameTitle = await prisma.movies.findFirst({
            where: {
                title:{ equals: title, mode: "insensitive"}
            },
        });
        
        if (movieWithSameTitle) {
            return res.status(409).send({message: "Já existe um filme cadastrado com esse título"});
        }

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
    return res.status(500).send({message: "Erro ao criar filme"});
}
});

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
});
