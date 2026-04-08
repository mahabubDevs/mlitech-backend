"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFormData = void 0;
const ApiErrors_1 = __importDefault(require("../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const validateFormData = (schema) => {
    return (req, res, next) => {
        try {
            let parsedData = {};
            //  multipart/form-data
            if (req.is("multipart/form-data")) {
                parsedData =
                    req.body.data && typeof req.body.data === "string"
                        ? JSON.parse(req.body.data)
                        : req.body.data || Object.assign({}, req.body);
            }
            // application/json
            else if (req.is("application/json")) {
                parsedData =
                    req.body.data && typeof req.body.data === "string"
                        ? JSON.parse(req.body.data)
                        : req.body.data || Object.assign({}, req.body);
            }
            else {
                throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.UNSUPPORTED_MEDIA_TYPE, "Unsupported content type");
            }
            //  Boolean conversion
            if (req.files) {
                const filesArray = Object.values(req.files).flat();
                parsedData.photos = filesArray.map(file => `/images/${file.filename}`);
            }
            // Ensure photos is an array
            if (!parsedData.photos)
                parsedData.photos = [];
            //  Numeric conversion
            ["birthYear", "racingRating", "racherRating", "breederRating"].forEach(field => {
                if (parsedData[field] !== undefined && parsedData[field] !== "") {
                    parsedData[field] = Number(parsedData[field]);
                }
            });
            //  Zod validation
            const parsed = schema.safeParse(parsedData);
            if (!parsed.success) {
                // Field name in error message
                const firstError = parsed.error.issues[0];
                const fieldName = firstError.path[0] || "Field";
                return next(new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `${fieldName}: ${firstError.message}`));
            }
            req.body = parsed.data;
            next();
        }
        catch (err) {
            next(err);
        }
    };
};
exports.validateFormData = validateFormData;
