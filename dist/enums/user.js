"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUSTOMER_SEGMENT = exports.SUBSCRIPTION_STATUS = exports.APPROVE_STATUS = exports.USER_REPORT = exports.USER_STATUS = exports.USER_ROLES = void 0;
var USER_ROLES;
(function (USER_ROLES) {
    USER_ROLES["ADMIN"] = "ADMIN";
    USER_ROLES["SUPER_ADMIN"] = "SUPER_ADMIN";
    USER_ROLES["USER"] = "USER";
    USER_ROLES["MERCENT"] = "MERCENT";
    USER_ROLES["ADMIN_REP"] = "ADMIN_REP";
    USER_ROLES["ADMIN_SELL"] = "ADMIN_SELL";
    USER_ROLES["VIEW_MERCENT"] = "VIEW_MERCENT";
    USER_ROLES["ADMIN_MERCENT"] = "ADMIN_MERCENT";
    USER_ROLES["VIEW_ADMIN"] = "VIEW_ADMIN";
})(USER_ROLES || (exports.USER_ROLES = USER_ROLES = {}));
var USER_STATUS;
(function (USER_STATUS) {
    USER_STATUS["ACTIVE"] = "active";
    USER_STATUS["INACTIVE"] = "inActive";
    USER_STATUS["BLOCK"] = "block";
    USER_STATUS["ARCHIVE"] = "archive";
})(USER_STATUS || (exports.USER_STATUS = USER_STATUS = {}));
var USER_REPORT;
(function (USER_REPORT) {
    USER_REPORT["REPORT"] = "report";
    USER_REPORT["NO_REPORT"] = "no_report";
})(USER_REPORT || (exports.USER_REPORT = USER_REPORT = {}));
var APPROVE_STATUS;
(function (APPROVE_STATUS) {
    APPROVE_STATUS["PENDING"] = "pending";
    APPROVE_STATUS["APPROVED"] = "approved";
    APPROVE_STATUS["REJECTED"] = "rejected";
})(APPROVE_STATUS || (exports.APPROVE_STATUS = APPROVE_STATUS = {}));
var SUBSCRIPTION_STATUS;
(function (SUBSCRIPTION_STATUS) {
    SUBSCRIPTION_STATUS["ACTIVE"] = "active";
    SUBSCRIPTION_STATUS["INACTIVE"] = "inActive";
})(SUBSCRIPTION_STATUS || (exports.SUBSCRIPTION_STATUS = SUBSCRIPTION_STATUS = {}));
// export enum CUSTOMER_SEGMENT {
//   NEW = "new",
//   RETURNING = "returning",
//   LOYAL = "loyal",
//   VIP = "vip",
//   ALL = "all",
// }
var CUSTOMER_SEGMENT;
(function (CUSTOMER_SEGMENT) {
    CUSTOMER_SEGMENT["NEW_CUSTOMER"] = "new_customer";
    CUSTOMER_SEGMENT["RETURNING_CUSTOMER"] = "returning_customer";
    CUSTOMER_SEGMENT["LOYAL_CUSTOMER"] = "loyal_customer";
    CUSTOMER_SEGMENT["VIP_CUSTOMER"] = "vip_customer";
    CUSTOMER_SEGMENT["ALL_CUSTOMER"] = "all_customer";
})(CUSTOMER_SEGMENT || (exports.CUSTOMER_SEGMENT = CUSTOMER_SEGMENT = {}));
