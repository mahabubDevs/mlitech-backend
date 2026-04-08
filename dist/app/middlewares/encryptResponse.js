"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptResponse = void 0;
const encryption_1 = require("../../util/encryption");
const encryptResponse = (req, res, next) => {
    const oldSend = res.send;
    res.send = function (body) {
        try {
            const encryptedBody = (0, encryption_1.encryptData)(body);
            return oldSend.call(this, encryptedBody);
        }
        catch (err) {
            console.error("Encryption Error:", err);
            return oldSend.call(this, body);
        }
    };
    next();
};
exports.encryptResponse = encryptResponse;
