import { Request, Response, NextFunction } from "express";
import { ApiLog } from "./../modules/analytics-real-time-server/analyticApi.model";

export const apiLogger = async (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", async () => {
  const responseTime = Date.now() - start;
  try {
    await ApiLog.create({
      endpoint: req.path,   // path → endpoint
      method: req.method,
      statusCode: res.statusCode,
      // responseTime optional, যদি model এ add করা থাকে
    });
  } catch (err) {
    console.error("ApiLog create failed:", err);
  }
});


  next();
};
