import app from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { setIO } from "./sockets/socketManager.js";
import { InitializeSocket } from "./sockets/socket.js";
import "dotenv/config";

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

setIO(io);
InitializeSocket(io);

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on PORT ${process.env.PORT}`);
});
