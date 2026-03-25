const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const cors = require("cors");


const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200,
};

// Security middleware setup
const setupSecurity = (app) => {
  app.use(cors(corsOptions));
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

  app.use(cors(corsOptions));
  app.use(xss());
  app.use(mongoSanitize());
  app.use(hpp());
  app.use(compression());
};

// Single module.exports at the end
module.exports = {
  setupSecurity,
  corsOptions,
};
