import express from "express";
import { UserRoutes } from "../modules/user/user.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
// import { PostRoutes } from '../modules/blogpost/post.route';
import { UserManagementRoutes } from "../modules/userManagement/usermanagement.routes";
// import { MatchingRoutes } from '../modules/matching/matching.routes';
// import { ChatRoutes } from '../modules/chat/chat.route';
// import { GameRoutes } from '../modules/game/game.routes';
// import { EventRoutes } from '../modules/event/event.route';
import { PromoRoutes } from "../modules/promotionAdmin/promotionAdmin.routes";
import { RuleRoutes } from "../modules/rule/rule.route";
// import { ShopRoutes } from '../modules/shopManagement/shop.routes';
// import { AurashopRoute } from '../modules/shopAuraSubscription/aurashop.routes';
// import { ServerHealthRoutes } from '../modules/analytics-real-time-server/analytic.route';
import { DashboardRoutes } from "../modules/dashbordOverview/dashboard.routes";
import { SubscriptionRoutes } from "../modules/subscription/subscription.routes";
import { PackageRoutes } from "../modules/package/package.routes";
import { PromoMercentRoutes } from "../modules/promotionMercent/promotionMercent.routes";
import { TierRoutes } from "../modules/point&TierSystem/tier.route";
import { SalesRepRoutes } from "../modules/salesRep/salesRep.route";
import { GiftCardRoute } from "../modules/giftCard/giftCard.route";
// import { AuraBundleRoute } from '../modules/shopAuroBundle/auraBundle.routes';
// import { BuyCall } from '../modules/buy/buy.routes';
// import { CallBundleRoute } from '../modules/shopCallBundle/callBundle.routes';
// import { ReportRoutes } from '../modules/report/report.routes';
// import { PackageRoutes } from '../modules/package/package.routes';

// import { SubscriptionRoutes } from '../modules/subscription/subscription.routes';

// import { RoleRoutes } from '../modules/role/role.routes';
// import { NotificationRoutes } from '../modules/notification/notification.routes';
// import { DashboardRoutes } from '../modules/dashbordOverview/dashboard.routes';
// import { AnalyticRoutes } from '../modules/analytics/analytic.route';
// // import { UserSubscriptionRoutes } from '../modules/userEmailSubscripton/userEmailSubscripton.routes';

const router = express.Router();

const apiRoutes = [
  { path: "/user", route: UserRoutes },
  { path: "/auth", route: AuthRoutes },
  { path: "/usermanagement", route: UserManagementRoutes },
  { path: "/overview", route: DashboardRoutes },
  { path: "/subscription", route: SubscriptionRoutes },
  { path: "/rule", route: RuleRoutes },
  { path: "/promo", route: PromoRoutes },
  { path: "/promomercent", route: PromoMercentRoutes },
  { path: "/tier", route: TierRoutes },
  { path: "/package", route: PackageRoutes },
  { path: "/sales-rep", route: SalesRepRoutes },
  { path: "/gift-card", route: GiftCardRoute },
  // {path: "/chat", route:ChatRoutes},
  // {path: "/game", route:GameRoutes},
  // {path: "/event", route:EventRoutes},
  // {path: "/shop", route:ShopRoutes},
  // {path: "/aurabundle", route:AuraBundleRoute},
  // {path: "/aura", route:AurashopRoute},
  // {path: "/server", route:ServerHealthRoutes},
  // {path: "/matching", route:MatchingRoutes},
  // { path: "/callpurchase", route: BuyCall },
  // { path: "/callbundle", route: CallBundleRoute },
  // { path: "/report", route: ReportRoutes },

  // { path: "/package", route: PackageRoutes },
  // { path: "/subscription", route: SubscriptionRoutes },
  // { path: "/role", route: RoleRoutes },
  // { path: "/usermanage", route: UserManagementRoutes },
  // { path: "/notification", route: NotificationRoutes },
  // { path: "/analytic", route:  AnalyticRoutes },
  // {path: "/user-subscription", route: UserSubscriptionRoutes},  // new user subscription route added
];

apiRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
