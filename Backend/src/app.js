import express from "express";
import authorRoutes from "./Routes/author.routes.js";

const app = express();

app.use(express.json());

app.use("/author", authorRoutes);

export default app;
