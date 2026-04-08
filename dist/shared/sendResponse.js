"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendResponse = (res, data) => {
    const resData = { success: data.success };
    if (data.message)
        resData.message = data.message;
    if (data.pagination)
        resData.pagination = data.pagination;
    if (data.data !== undefined)
        resData.data = data.data;
    return res.status(data.statusCode).json(resData);
};
exports.default = sendResponse;
