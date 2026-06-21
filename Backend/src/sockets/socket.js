export const InitializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
    });
  });
};
