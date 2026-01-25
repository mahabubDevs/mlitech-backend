// import express from "express";
// import { UserRoutes } from "../modules/user/user.routes";
// import { AuthRoutes } from "../modules/auth/auth.routes";

// import { PromoRoutes } from "../modules/promotionAdmin/promotionAdmin.routes";
// import { RuleRoutes } from "../modules/rule/rule.route";

// import { DashboardRoutes } from "../modules/dashbordOverview/dashboard.routes";
// import { SubscriptionRoutes } from "../modules/subscription/subscription.routes";
// import { PackageRoutes } from "../modules/package/package.routes";

// import { SalesRepRoutes } from "../modules/salesRep/salesRep.route";
// import { AdminRoutes } from "../modules/admin/admin.route";
// import { DashboardMercentRoutes } from "../modules/dashboardOverviewMercent/dashbordMercent.route";
// import { MercentCustomerListRoutes } from "../modules/mercent/mercentCustomerList/mercentCustomerList.routes";
// import { contacUsRoutes } from "../modules/contactUs/contactUs.routes";
// import { PromoMercentRoutes } from "../modules/mercent/promotionMercent/promotionMercent.routes";
// import { TierRoutes } from "../modules/mercent/point&TierSystem/tier.route";
// import { DigitalCardRoutes } from "../modules/customer/digitalCard/digitalCard.routes";
// import { SellManagementRoute } from "../modules/mercent/mercentSellManagement/mercentSellManagement.route";
// import { RatingRoutes } from "../modules/customer/rating/rating.routes";
// import { FavoriteRoutes } from "../modules/customer/favorite/favorite.routes";
// import { RecentViewedPromotionRoutes } from "../modules/recentViewedPromotion/recentViewedPromotion.route";
// import { AnalyticsRoutes } from "../modules/analytics/analytics.route";
// import { UserManagementRoutes } from "../modules/userManagement/usermanagement.routes";
// import { AuditRoutes } from "../modules/auditLog/audit.routes";

// import { AdminPromoMercentRoutes } from "../modules/adminSellandTier/promotionMercent/promotionMercent.routes";
// import { AdminTierRoutes } from "../modules/adminSellandTier/point&TierSystem/tier.route";

// import { NotificationRoutes } from "../modules/notification/notification.routes";
// import { PushRoutes } from "../modules/pushNotification/push.routes";

// import { ReferralRoutes } from "../modules/referral/referral.route";

// import { MercentUserManagement } from "../modules/merchentUserManagement/mercentUserManagement.routes";


// const router = express.Router();

// const apiRoutes = [
//   { path: "/user", route: UserRoutes },
//   { path: "/auth", route: AuthRoutes },
//   { path: "/usermanagement", route: UserManagementRoutes },
//   { path: "/overview", route: DashboardRoutes },
//   { path: "/subscription", route: SubscriptionRoutes },
//   { path: "/rule", route: RuleRoutes },
//   { path: "/promo", route: PromoRoutes },
//   { path: "/promo-merchant", route: PromoMercentRoutes },
//   { path: "/tier", route: TierRoutes },
//   { path: "/package", route: PackageRoutes },
//   { path: "/sales-rep", route: SalesRepRoutes },
//   { path: "/admin", route: AdminRoutes },
//   { path: "/mercent", route: DashboardMercentRoutes },
//   { path: "/mercent-customer", route: MercentCustomerListRoutes },

//   { path: "/contact", route: contacUsRoutes },
//   { path: "/add-promotion", route: DigitalCardRoutes },
//   { path: "/sell", route: SellManagementRoute },
//   { path: "/rating", route: RatingRoutes },
//   { path: "/favorite", route: FavoriteRoutes },
//   { path: "/recent-viewed-promotions", route: RecentViewedPromotionRoutes },
//   { path: "/report-analytics", route: AnalyticsRoutes },
//   { path: "/audit", route: AuditRoutes },
//   { path: "/admin-promo", route: AdminPromoMercentRoutes },
//   { path: "/admin-tier", route: AdminTierRoutes },
//   { path: "/push-notification", route: PushRoutes },
//   { path: "/merchant-user", route: MercentUserManagement },

//   { path: "/notifications", route: NotificationRoutes },
//   { path: "/referrals", route: ReferralRoutes },
// ];

// apiRoutes.forEach((route) => router.use(route.path, route.route));
// export default router;





import express from "express";
import { UserRoutes } from "../modules/user/user.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { PromoRoutes } from "../modules/promotionAdmin/promotionAdmin.routes";
import { RuleRoutes } from "../modules/rule/rule.route";
import { DashboardRoutes } from "../modules/dashbordOverview/dashboard.routes";
import { SubscriptionRoutes } from "../modules/subscription/subscription.routes";
import { PackageRoutes } from "../modules/package/package.routes";
import { SalesRepRoutes } from "../modules/salesRep/salesRep.route";
import { AdminRoutes } from "../modules/admin/admin.route";
import { DashboardMercentRoutes } from "../modules/dashboardOverviewMercent/dashbordMercent.route";
import { MercentCustomerListRoutes } from "../modules/mercent/mercentCustomerList/mercentCustomerList.routes";
import { contacUsRoutes } from "../modules/contactUs/contactUs.routes";
import { PromoMercentRoutes } from "../modules/mercent/promotionMercent/promotionMercent.routes";
import { TierRoutes } from "../modules/mercent/point&TierSystem/tier.route";
import { DigitalCardRoutes } from "../modules/customer/digitalCard/digitalCard.routes";
import { SellManagementRoute } from "../modules/mercent/mercentSellManagement/mercentSellManagement.route";
import { RatingRoutes } from "../modules/customer/rating/rating.routes";
import { FavoriteRoutes } from "../modules/customer/favorite/favorite.routes";
import { RecentViewedPromotionRoutes } from "../modules/recentViewedPromotion/recentViewedPromotion.route";
import { AnalyticsRoutes } from "../modules/analytics/analytics.route";
import { UserManagementRoutes } from "../modules/userManagement/usermanagement.routes";
import { AuditRoutes } from "../modules/auditLog/audit.routes";
import { AdminPromoMercentRoutes } from "../modules/adminSellandTier/promotionMercent/promotionMercent.routes";
import { AdminTierRoutes } from "../modules/adminSellandTier/point&TierSystem/tier.route";
import { NotificationRoutes } from "../modules/notification/notification.routes";
import { PushRoutes } from "../modules/pushNotification/push.routes";
import { ReferralRoutes } from "../modules/referral/referral.route";

import { MercentUserManagement } from "../modules/merchentUserManagement/mercentUserManagement.routes";

import { DisclaimerRoutes } from "../modules/disclaimer/disclaimer.route";
import { TransectionRoute } from "../modules/transectionHistory/transection.routes";


const router = express.Router();

const apiRoutes = [
  { path: "/add-promotion", route: DigitalCardRoutes },
  { path: "/admin", route: AdminRoutes },
  { path: "/admin-promo", route: AdminPromoMercentRoutes },
  { path: "/admin-tier", route: AdminTierRoutes },
  { path: "/auth", route: AuthRoutes },
  { path: "/audit", route: AuditRoutes },
  { path: "/contact", route: contacUsRoutes },
  { path: "/disclaimers", route: DisclaimerRoutes },
  { path: "/favorite", route: FavoriteRoutes },
  { path: "/history", route: TransectionRoute },
  { path: "/mercent", route: DashboardMercentRoutes },
  { path: "/mercent-customer", route: MercentCustomerListRoutes },
  { path: "/merchant-user", route: MercentUserManagement },
  { path: "/notifications", route: NotificationRoutes },
  { path: "/overview", route: DashboardRoutes },
  { path: "/package", route: PackageRoutes },
  { path: "/push-notification", route: PushRoutes },
  { path: "/promo", route: PromoRoutes },
  { path: "/promo-merchant", route: PromoMercentRoutes },
  { path: "/recent-viewed-promotions", route: RecentViewedPromotionRoutes },
  { path: "/referrals", route: ReferralRoutes },
  { path: "/report-analytics", route: AnalyticsRoutes },
  { path: "/rating", route: RatingRoutes },
  { path: "/sales-rep", route: SalesRepRoutes },
  { path: "/sell", route: SellManagementRoute },
  { path: "/subscription", route: SubscriptionRoutes },
  { path: "/tier", route: TierRoutes },
  { path: "/user", route: UserRoutes },
  { path: "/usermanagement", route: UserManagementRoutes },
];


apiRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
