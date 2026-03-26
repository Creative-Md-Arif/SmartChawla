// middlewares/security.js
const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

// Security middleware setup - CORS বাদ দিলাম (app.js এ আছে)
const setupSecurity = (app) => {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:", "http:"],
          connectSrc: ["'self'", ...allowedOrigins],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(xss());
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(compression());
};

module.exports = {
  setupSecurity,
  allowedOrigins,
};
