import "dotenv/config";
import express from "express";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
 (!connectionString) 
    


const port =  3000;
const app = express();
const adapter = new PrismaPg({
    connectionString,
});
const prisma = new PrismaClient({
    adapter,
});

app.get("/", (req, res) => {
    res.send("Servidor MovieFlix funcionando");
});

app.get("/movies", async (req, res) => {
    
        const movies = await prisma.movies.findMany();
        res.json(movies);
  
});



app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}`);
});
