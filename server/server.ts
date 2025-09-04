import { createServer } from "./index.js";

async function startStandaloneServer() {
  try {
    const { app, server } = await createServer();

    const PORT = process.env.PORT || 3001;

    server.listen(PORT, () => {
      console.log(`🚀 OrganLink server with Socket.IO running on port ${PORT}`);
      console.log(`🔌 Socket.IO ready for real-time connections`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startStandaloneServer().catch(console.error);
