"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISCLAIMER_NOTIFICATION_MAP = void 0;
const user_1 = require("../../../enums/user");
const disclaimer_constants_1 = require("./disclaimer.constants");
exports.DISCLAIMER_NOTIFICATION_MAP = {
    [disclaimer_constants_1.DisclaimerTypes.CUSTOMER_TERMS_AND_CONDITIONS]: {
        title: 'Customer Terms & Conditions Updated',
        body: 'Customer Terms and Conditions have been updated.',
        audience: user_1.USER_ROLES.USER,
    },
    [disclaimer_constants_1.DisclaimerTypes.CUSTOMER_PRIVACY_POLICY]: {
        title: 'Customer Privacy Policy Updated',
        body: 'Customer Privacy Policy has been updated.',
        audience: user_1.USER_ROLES.USER,
    },
    [disclaimer_constants_1.DisclaimerTypes.MERCHANT_TERMS_AND_CONDITIONS]: {
        title: 'Merchant Terms & Conditions Updated',
        body: 'Merchant Terms and Conditions have been updated.',
        audience: user_1.USER_ROLES.MERCENT,
    },
    [disclaimer_constants_1.DisclaimerTypes.MERCHANT_PRIVACY_POLICY]: {
        title: 'Merchant Privacy Policy Updated',
        body: 'Merchant Privacy Policy has been updated.',
        audience: user_1.USER_ROLES.MERCENT,
    },
};
