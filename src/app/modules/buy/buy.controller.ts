import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BuyService } from "./buy.service";

// Express middleware declare req.user
declare global {
  namespace Express {
    interface User {
      _id: string;
    }
  }
}

// Buy a package
const buyPackage = async (req: Request, res: Response) => {
  try {
    const { packageId } = req.body;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const userId = req.user._id;

    const purchase = await BuyService.buyPackage(userId, packageId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Package purchased successfully",
      data: purchase,
    });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to purchase package",
    });
  }
};

// Get user's purchase history
const getUserPurchases = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const userId = req.user._id;

    const purchases = await BuyService.getUserPurchases(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: purchases,
    });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to fetch purchases",
    });
  }
};

export const BuyController = {
  buyPackage,
  getUserPurchases,
};
