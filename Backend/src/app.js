import express from "express";
import cookieParser from "cookie-parser";
import authorRoutes from "./Routes/author.routes.js";
import bookRoutes from "./Routes/book.routes.js";
import AdminRoutes from "./Routes/admin.routes.js";
import TicketRoutes from "./Routes/ticket.routes.js";
import conversationRoutes from "./Routes/ticket-conversation.routes.js";
import llmRoutes from "./Routes/llm.routes.js";
import cors from "cors";

const app = express();

const allowedOrigins = ["http://localhost:5173"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow request
    } else {
      callback(new Error("Not allowed by CORS")); // Block request
    }
  },
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Ensure all HTTP methods work
  allowedHeaders: ["Content-Type", "Authorization"], // Allow required headers
};

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.use("/author", authorRoutes);
app.use("/book", bookRoutes);
app.use("/admin", AdminRoutes);
app.use("/ticket", TicketRoutes);
app.use("/conversation", conversationRoutes);
app.use("/llm", llmRoutes);

export default app;
