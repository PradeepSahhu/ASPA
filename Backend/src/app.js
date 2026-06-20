import express from "express";
import cookieParser from "cookie-parser";
import authorRoutes from "./Routes/author.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/author", authorRoutes);

export default app;
