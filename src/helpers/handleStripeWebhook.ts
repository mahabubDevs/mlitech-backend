import { Request, Response } from 'express';
import Stripe from 'stripe';
import colors from 'colors';
import {
    handleAccountUpdatedEvent,
    handleSubscriptionCreated,
    handleSubscriptionDeleted,
    handleSubscriptionUpdated,
} from '../handlers';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../shared/logger';
import config from '../config';
import ApiError from '../errors/ApiErrors';
import stripe from '../config/stripe';
import { SubscriptionService } from '../app/modules/subscription/subscription.service';

const handleStripeWebhook = async (req: Request, res: Response) => {
    console.log("=======================>>Received Stripe webhook");
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = config.stripe.webhookSecret as string;
    console.log("webhook", signature, webhookSecret);

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
        console.error("❌ Webhook verification failed:", error);
        return res.status(400).send(`Webhook Error: ${(error as Error).message}`);
    }

    try {
        switch (event.type) {
           case 'checkout.session.completed':
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.client_reference_id;
                const packageId = session.metadata?.packageId;
                const subscriptionId = session.subscription as string;

                if (!userId || !packageId || !subscriptionId) {
                    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid session metadata");
                }

                const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
console.log("inside checkout.session.completed webhook handler");
                // Save subscription in DB
                await SubscriptionService.activateSubscriptionInDB(userId, packageId, stripeSubscription);
            break;


            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;

            case 'account.updated':
                await handleAccountUpdatedEvent(event.data.object as Stripe.Account);
                break;

            default:
                logger.warn(colors.bgGreen.bold(`Unhandled event type: ${event.type}`));
        }
    } catch (error) {
        console.error("❌ Error handling event:", error);
        return res.status(500).send(`Webhook handler failed: ${(error as Error).message}`);
    }

    return res.status(200).send({ received: true });
};


export default handleStripeWebhook;