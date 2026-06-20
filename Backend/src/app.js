import express from "express";
import cookieParser from "cookie-parser";
import authorRoutes from "./Routes/author.routes.js";
import bookRoutes from "./Routes/book.routes.js";
import AdminRoutes from "./Routes/admin.routes.js";
import TicketRoutes from "./Routes/ticket.routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/author", authorRoutes);
app.use("/book", bookRoutes);
app.use("/admin", AdminRoutes);
app.use("/ticket", TicketRoutes);

export default app;
