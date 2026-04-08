"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../config"));
const ApiErrors_1 = __importDefault(require("../../errors/ApiErrors"));
const handleValidationError_1 = __importDefault(require("../../errors/handleValidationError"));
const handleZodError_1 = __importDefault(require("../../errors/handleZodError"));
const logger_1 = require("../../shared/logger");
const http_status_codes_1 = require("http-status-codes");
const globalErrorHandler = (error, req, res, next) => {
    // ✅ Updated line 12: Safe logging
    if (config_1.default.node_env === 'development') {
        console.log('🚨 globalErrorHandler', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
    else {
        logger_1.errorLogger.error('🚨 globalErrorHandler', error);
    }
    let statusCode = 500;
    let message = 'Something went wrong';
    let errorMessages = [];
    if (error.name === 'ZodError') {
        const simplifiedError = (0, handleZodError_1.default)(error);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorMessages = simplifiedError.errorMessages;
    }
    else if (error.name === 'ValidationError') {
        const simplifiedError = (0, handleValidationError_1.default)(error);
        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorMessages = simplifiedError.errorMessages;
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = http_status_codes_1.StatusCodes.UNAUTHORIZED;
        message = 'Session Expired';
        errorMessages = (error === null || error === void 0 ? void 0 : error.message)
            ? [
                {
                    path: '',
                    message: 'Your session has expired. Please log in again to continue.',
                },
            ]
            : [];
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = http_status_codes_1.StatusCodes.UNAUTHORIZED;
        message = 'Invalid Token';
        errorMessages = (error === null || error === void 0 ? void 0 : error.message)
            ? [
                {
                    path: '',
                    message: 'Your token is invalid. Please log in again to continue.',
                },
            ]
            : [];
    }
    else if (error instanceof ApiErrors_1.default) {
        statusCode = error.statusCode;
        message = error.message;
        errorMessages = error.message
            ? [
                {
                    path: '',
                    message: error.message,
                },
            ]
            : [];
    }
    else if (error instanceof Error) {
        message = error.message;
        errorMessages = error.message
            ? [
                {
                    path: '',
                    message: error === null || error === void 0 ? void 0 : error.message,
                },
            ]
            : [];
    }
    res.status(statusCode).json({
        success: false,
        message,
        errorMessages,
        stack: config_1.default.node_env !== 'production' ? error === null || error === void 0 ? void 0 : error.stack : undefined,
    });
};
exports.default = globalErrorHandler;
