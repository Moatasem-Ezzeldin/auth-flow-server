//////////////////////////////
// 💥 1. UNCAUGHT EXCEPTION
// يمسك أخطاء JavaScript المباشرة (sync errors)
// مثل undefined variables أو crashes قبل async handling
//////////////////////////////

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION 💥", err);

  process.exit(1);
});

const express = require("express");
const mongoSanitize = require("express-mongo-sanitize");
// const xss = require("xss-clean");
const helmet = require("helmet");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config({path:".env"});
const morgan = require("morgan");
const dbConnection = require("./config/database");

// Routes
const userRoute = require("./routes/userRoute");
const authRoute = require("./routes/authRoute");
const adminRoure = require("./routes/adminRoure");

const ApiError = require("./utils/apiError");
const globalError = require("./middlewares/errorMiddlewares");

// Connection with database 
dbConnection();

// express app
const app = express();

// Middlewares
app.use(express.json());
// app.use(mongoSanitize());
// app.use(xss());
app.use(helmet());
app.set("trust proxy", 1);
app.use(hpp());
app.set("query parser", "extended");
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_BASE_URL, credentials: true }));
if(process.env.NODE_ENV == "development") {
    app.use(morgan('dev'));
    console.log(`mode: ${process.env.NODE_ENV}`);
}

// Mount Routes
app.use("/api/v1/users/me", userRoute);
app.use("/api/v1/admin/users", adminRoure);
app.use("/api/v1/auth", authRoute);
// if route not find    
app.use((req, res, next) => {
    next(new ApiError(`Can't find this route: ${req.originalUrl}`, 404));
});
// Global errors handeling middlewares
app.use(globalError);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}`);
});

//////////////////////////////
// ⚠️ 2. UNHANDLED REJECTION
// يمسك أي Promise فشل بدون catch
// مثل DB errors أو async calls ما انمسكت
//////////////////////////////

process.on("unhandledRejection", (err) => {
  console.error(`UNHANDLED REJECTION ⚠️ ${err.name}: ${err.message}`);

  console.error("Error stack: ",err.stack);

  server.close(() => {
    console.log("Server shutting down...");
    process.exit(1);
  });
});



//////////////////////////////
// 🚨 3. SIGTERM (OPTIONAL)
// يمسك إشارة إيقاف السيرفر من النظام (Docker / hosting)
// shutdown نظيف بدون كسر requests
//////////////////////////////

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");

  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});