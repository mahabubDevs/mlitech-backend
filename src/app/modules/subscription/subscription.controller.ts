// src/modules/subscription/subscription.controller.ts
import { Request, Response } from "express";
import { SubscriptionService } from "./subscription.service";

export const SubscriptionController = {
  createSession: async (req: Request, res: Response) => {
    const { packageId } = req.body;
    const userId = (req.user as any)._id;
    const successUrl = "https://yourfrontend.com/payment-success";
    const cancelUrl = "https://yourfrontend.com/payment-cancel";

    const url = await SubscriptionService.createCheckoutSession(userId, packageId, successUrl, cancelUrl);
    res.json({ url });
  },
};
