"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_routes_1 = require("../modules/user/user.routes");
const auth_routes_1 = require("../modules/auth/auth.routes");
const promotionAdmin_routes_1 = require("../modules/promotionAdmin/promotionAdmin.routes");
const dashboard_routes_1 = require("../modules/dashbordOverview/dashboard.routes");
const subscription_routes_1 = require("../modules/subscription/subscription.routes");
const package_routes_1 = require("../modules/package/package.routes");
const salesRep_route_1 = require("../modules/salesRep/salesRep.route");
const admin_route_1 = require("../modules/admin/admin.route");
const dashbordMercent_route_1 = require("../modules/dashboardOverviewMercent/dashbordMercent.route");
const mercentCustomerList_routes_1 = require("../modules/mercent/mercentCustomerList/mercentCustomerList.routes");
const contactUs_routes_1 = require("../modules/contactUs/contactUs.routes");
const promotionMercent_routes_1 = require("../modules/mercent/promotionMercent/promotionMercent.routes");
const tier_route_1 = require("../modules/mercent/point&TierSystem/tier.route");
const digitalCard_routes_1 = require("../modules/customer/digitalCard/digitalCard.routes");
const mercentSellManagement_route_1 = require("../modules/mercent/mercentSellManagement/mercentSellManagement.route");
const rating_routes_1 = require("../modules/customer/rating/rating.routes");
const favorite_routes_1 = require("../modules/customer/favorite/favorite.routes");
const recentViewedPromotion_route_1 = require("../modules/recentViewedPromotion/recentViewedPromotion.route");
const analytics_route_1 = require("../modules/analytics/analytics.route");
const usermanagement_routes_1 = require("../modules/userManagement/usermanagement.routes");
const audit_routes_1 = require("../modules/auditLog/audit.routes");
const promotionMercent_routes_2 = require("../modules/adminSellandTier/promotionMercent/promotionMercent.routes");
const tier_route_2 = require("../modules/adminSellandTier/point&TierSystem/tier.route");
const notification_routes_1 = require("../modules/notification/notification.routes");
const push_routes_1 = require("../modules/pushNotification/push.routes");
const referral_route_1 = require("../modules/referral/referral.route");
const mercentUserManagement_routes_1 = require("../modules/merchentUserManagement/mercentUserManagement.routes");
const disclaimer_route_1 = require("../modules/disclaimer/disclaimer.route");
const transection_routes_1 = require("../modules/transectionHistory/transection.routes");
const router = express_1.default.Router();
const apiRoutes = [
    { path: "/add-promotion", route: digitalCard_routes_1.DigitalCardRoutes },
    { path: "/admin", route: admin_route_1.AdminRoutes },
    { path: "/admin-promo", route: promotionMercent_routes_2.AdminPromoMercentRoutes },
    { path: "/admin-tier", route: tier_route_2.AdminTierRoutes },
    { path: "/auth", route: auth_routes_1.AuthRoutes },
    { path: "/audit", route: audit_routes_1.AuditRoutes },
    { path: "/contact", route: contactUs_routes_1.contacUsRoutes },
    { path: "/disclaimers", route: disclaimer_route_1.DisclaimerRoutes },
    { path: "/favorite", route: favorite_routes_1.FavoriteRoutes },
    { path: "/history", route: transection_routes_1.TransectionRoute },
    { path: "/mercent", route: dashbordMercent_route_1.DashboardMercentRoutes },
    { path: "/mercent-customer", route: mercentCustomerList_routes_1.MercentCustomerListRoutes },
    { path: "/merchant-user", route: mercentUserManagement_routes_1.MercentUserManagement },
    { path: "/notifications", route: notification_routes_1.NotificationRoutes },
    { path: "/overview", route: dashboard_routes_1.DashboardRoutes },
    { path: "/package", route: package_routes_1.PackageRoutes },
    { path: "/push-notification", route: push_routes_1.PushRoutes },
    { path: "/promo", route: promotionAdmin_routes_1.PromoRoutes },
    { path: "/promo-merchant", route: promotionMercent_routes_1.PromoMercentRoutes },
    { path: "/recent-viewed-promotions", route: recentViewedPromotion_route_1.RecentViewedPromotionRoutes },
    { path: "/referrals", route: referral_route_1.ReferralRoutes },
    { path: "/report-analytics", route: analytics_route_1.AnalyticsRoutes },
    { path: "/rating", route: rating_routes_1.RatingRoutes },
    { path: "/sales-rep", route: salesRep_route_1.SalesRepRoutes },
    { path: "/sell", route: mercentSellManagement_route_1.SellManagementRoute },
    { path: "/subscription", route: subscription_routes_1.SubscriptionRoutes },
    { path: "/tier", route: tier_route_1.TierRoutes },
    { path: "/user", route: user_routes_1.UserRoutes },
    { path: "/usermanagement", route: usermanagement_routes_1.UserManagementRoutes },
];
apiRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
