import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

// Logs query schema
const logsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minLoad: z.preprocess((val) => Number(val), z.number().min(0).optional()),
  maxLoad: z.preprocess((val) => Number(val), z.number().min(0).optional()),
  page: z.preprocess((val) => Number(val), z.number().min(1).optional()),
  limit: z.preprocess((val) => Number(val), z.number().min(1).max(100).optional()),
});

export const validateLogsQuery = (req: Request, res: Response, next: NextFunction) => {
  try {
    logsQuerySchema.parse(req.query);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        statusCode: 400,
        success: false,
        message: "Invalid query parameters",
        errors: err.errors,
      });
    }
    next(err);
  }
};
