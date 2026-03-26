const http = require("http");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./socket/io");

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error("Error Name:", err.name);
  process.exit(1);
});

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

server.timeout = 30 * 60 * 1000;
server.keepAliveTimeout = 35 * 60 * 1000;
server.headersTimeout = 36 * 60 * 1000;

initSocket(server);

// Start server
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

server.listen(PORT, () => {
  console.log(`✅ Server running in ${NODE_ENV} mode on port ${PORT}`);
});

// 🔥 FIXED: Don't shutdown in development
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥");
  console.error("Error Name:", err.name);

  if (process.env.NODE_ENV === "development") {
    return; // Don't exit
  }

  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
 server.close(() => console.log("Process terminated by SIGTERM"));
});

process.on("SIGINT", () => {
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});
