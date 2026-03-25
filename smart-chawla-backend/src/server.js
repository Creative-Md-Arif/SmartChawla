const http = require('http');

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}


const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./socket/io');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});


// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);



server.timeout = 30 * 60 * 1000; // 30 minutes
server.keepAliveTimeout = 35 * 60 * 1000; // 35 minutes
server.headersTimeout = 36 * 60 * 1000; // 36 minutes

app.use((req, res, next) => {

  if (
    req.path.includes("/courses") &&
    (req.method === "POST" || req.method === "PUT")
  ) {
    req.setTimeout(30 * 60 * 1000); 
    res.setTimeout(30 * 60 * 1000);
  }
  next();
});

// Initialize Socket.io
initSocket(server);

// Start server
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

server.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
    console.log(`⏱️ Server timeout: ${server.timeout / 60000} minutes`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);

  // Graceful shutdown
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
