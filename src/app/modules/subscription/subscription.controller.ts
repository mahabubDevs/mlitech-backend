import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { SubscriptionService } from "./subscription.service";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";




const createSubscription = catchAsync(async (req: Request, res: Response) => {
    const { packageId } = req.body;
    if (!req.user) throw new Error("User not found");
    if (!packageId) throw new Error("Package ID is required");

    const userId = (req.user as any)._id || (req.user as any).id;
    if (!userId) throw new Error("User ID not found");

    const session = await SubscriptionService.createSubscriptionSession(userId, packageId);

    if (session.url) {
        // Paid plan → Stripe redirect
        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Stripe checkout session created successfully",
            data: session
        });
    } else {
        // Free plan → no redirect
        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: "Free plan activated successfully",
            data: session.subscription
        });
    }
});




const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new Error("User not found");

    const result = await SubscriptionService.cancelSubscription(req.user);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Your subscription will be cancelled at the end of current period",
        data: result
    });
});


const subscriptions = catchAsync(async (req: Request, res: Response) => {
    const result = await SubscriptionService.subscriptionsFromDB(req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Subscription List Retrieved Successfully",
        data: result
    })
});

const subscriptionDetails = catchAsync(async (req: Request, res: Response) => {

    if (!req.user) throw new Error("User not found");
    const result = await SubscriptionService.subscriptionDetailsFromDB(req.user);



    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Subscription Details Retrieved Successfully",
        data: result.subscription
    })
});

const companySubscriptionDetails = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.companySubscriptionDetailsFromDB(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Company Subscription Details Retrieved Successfully",
    data: result.subscriptions || [], // ✅ Always return array
  });
});


export const SubscriptionController = {
    createSubscription,
    subscriptions,
    subscriptionDetails,
    companySubscriptionDetails,
    cancelSubscription
}