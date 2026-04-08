"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_status_codes_1 = require("http-status-codes");
const morgan_1 = require("./shared/morgan");
const routes_1 = __importDefault(require("../src/app/routes"));
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const express_session_1 = __importDefault(require("express-session"));
// import passportConfig from "./config/passport"; // Adjust the path as necessary
//  SubscriptionRoutes import 
const handleStripeWebhook_1 = __importDefault(require("./helpers/handleStripeWebhook"));
const app = (0, express_1.default)();
// ⚡️ Stripe webhook route must be before json parser
app.post('/api/v1/subscription/webhook', express_1.default.raw({ type: 'application/json' }), // raw body
handleStripeWebhook_1.default);
// morgan
app.use(morgan_1.Morgan.successHandler);
app.use(morgan_1.Morgan.errorHandler);
// body parser
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options("*", (0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ limit: "10mb", extended: true }));
// file retrieve
app.use(express_1.default.static("uploads"));
// Session middleware
app.use((0, express_session_1.default)({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // production a HTTPS should be true
}));
//  Passport initialize
// app.use(passport.initialize());
// app.use(passport.session());
// 🔹 Worker PID logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        console.log(`[Worker ${process.pid}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
});
// router
app.use("/api/v1", routes_1.default);
app.get("/", (req, res) => {
    res.send("Hey Backend, How can I assist you ");
});
// global error handle
app.use(globalErrorHandler_1.default);
// handle not found route
app.use((req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Not Found",
        errorMessages: [
            {
                path: req.originalUrl,
                message: "API DOESN'T EXIST",
            },
        ],
    });
});
exports.default = app;
