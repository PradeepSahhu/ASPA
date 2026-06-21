export const InitializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("conversation:join", ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(conversationId);
    });

    socket.on("typing:start", ({ conversationId, userLabel }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit("typing:indicator", {
        isTyping: true,
        userLabel: userLabel || "User",
      });
    });

    socket.on("typing:stop", ({ conversationId, userLabel }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit("typing:indicator", {
        isTyping: false,
        userLabel: userLabel || "User",
      });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
    });
  });
};
