// src/modules/purchase/purchase.controller.ts
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuraBundleService } from "../shopAuroBundle/auraBundle.service";
import { verifyAndroidReceipt, verifyIosReceipt } from "../../middlewares/inAppPaymentCheck";
import { AuraSubscriptionService } from "../shopAuraSubscription/aurashop.service";


const createPurchase = async (req: Request, res: Response) => {
  const { userId, packageId, platform, receipt, productId, packageName } = req.body;

  let verified = false;
  if (platform === "ios") verified = await verifyIosReceipt(receipt);
  else if (platform === "android")
    verified = await verifyAndroidReceipt(packageName, productId, receipt); // receipt = purchaseToken

  if (!verified) return res.status(400).json({ success: false, message: "Invalid receipt" });

  const purchase = await AuraBundleService.addUserPurchase(userId, packageId, platform, receipt);

  res.status(200).json({ success: true, message: "Purchase successful", data: purchase });
};


// const createSubscriptionPurchase = async (req: Request, res: Response) => {

//   if (!req.user) {
//     return res.status(401).json({ success: false, message: "Unauthorized" });
//   }
//   const userId = req.user._id;  // JWT থেকে userId
//   const { packageId, platform, receipt } = req.body;

//   // 1. package fetch
//   const pkg = await AuraSubscriptionService.getSinglePackage(packageId);
//   if (!pkg || !pkg.isActive) return res.status(400).json({ success: false, message: "Package not found or inactive" });

//   // 2. receipt verification
//   let verified = false;
//   if (platform === "ios") {
//     verified = await verifyIosReceipt(receipt); 
//   } else if (platform === "android") {
//     verified = await verifyAndroidReceipt(packageId,pkg.productId, receipt); 
//   }
//   if (!verified) return res.status(400).json({ success: false, message: "Invalid receipt" });

//   // 3. Create subscription for user
//   const subscription = await AuraSubscriptionService.addUserSubscription(userId, pkg);

//   res.status(200).json({ success: true, message: "Subscription purchased successfully", data: subscription });
// };



export const PurchaseController = { 
  createPurchase,
  // createSubscriptionPurchase 
};



// src/modules/purchase/purchase.controller.ts
const createPurchaseTest = async (req: Request, res: Response) => {
  
  if (!req.user || !req.user._id) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
  }

  const userId = req.user._id; 
  const {  packageId, platform, receipt, productId, packageName } = req.body;

  // এখানে receipt verification skip
  const purchase = await AuraBundleService.addUserPurchase(userId, packageId, platform, receipt);

  res.status(200).json({ success: true, message: "Test purchase successful", data: purchase });
};

export const PurchaseControllerTest = { createPurchaseTest };
