import express from "express";
import cookieParser from "cookie-parser";
import authorRoutes from "./Routes/author.routes.js";
import bookRoutes from "./Routes/book.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/author", authorRoutes);
app.use("/book", bookRoutes);

export default app;
