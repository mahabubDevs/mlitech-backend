"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuraSubscriptionController = void 0;
const http_status_codes_1 = require("http-status-codes");
const aurashop_service_1 = require("./aurashop.service");
//  const  createPackage = async (req: Request, res: Response) => {
//     const payload: IPackage = req.body; // <-- type enforce
//     console.log("Payload received in controller:", payload);
//     const newPackage = await AuraSubscriptionService.createPackage(payload);
//     res.status(StatusCodes.CREATED).json({
//       success: true,
//       message: "Package created successfully",
//       data: newPackage,
//     });
//   }
const updatePackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const payload = req.body;
    const updated = yield aurashop_service_1.AuraSubscriptionService.updatePackage(id, payload);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Package updated successfully",
        data: updated,
    });
});
const deletePackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield aurashop_service_1.AuraSubscriptionService.deletePackage(id);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Package deleted successfully",
    });
});
const togglePackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updated = yield aurashop_service_1.AuraSubscriptionService.togglePackage(id);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Package status toggled successfully",
        data: updated,
    });
});
const getSinglePackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const pkg = yield aurashop_service_1.AuraSubscriptionService.getSinglePackage(id);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        data: pkg,
    });
});
const getAllPackages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield aurashop_service_1.AuraSubscriptionService.getAllPackages(req.query);
    res.status(http_status_codes_1.StatusCodes.OK).json(Object.assign({ success: true }, result));
});
exports.AuraSubscriptionController = {
    // createPackage,
    updatePackage,
    deletePackage,
    togglePackage,
    getSinglePackage,
    getAllPackages
};
