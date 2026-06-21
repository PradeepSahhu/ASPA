export const InitializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("conversation:join", ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(conversationId);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
    });
  });
};
