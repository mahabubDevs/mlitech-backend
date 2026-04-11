import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AdminService } from "./admin.service";
import { JwtPayload } from "jsonwebtoken";

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AdminService.createAdminToDB(payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Admin created Successfully",
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const payload = req.params.id;
  const result = await AdminService.deleteAdminFromDB(payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Admin Deleted Successfully",
    data: result,
  });
});

const getAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAdminFromDB();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Admin Retrieved Successfully",
    data: result,
  });
});
const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.updateUserStatus(
    req.params.id,
    req.body.status
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User status updated Successfully",
    data: result,
  });
});

const getAllCustomers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllCustomers(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All customers Retrieved Successfully",
    data: result.allcustomers,
    pagination: result.pagination,
  });
});


//================= customer export ===================//
const exportCustomers = catchAsync(async (req: Request, res: Response) => {
  const buffer = await AdminService.exportCustomers(req.query);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=customers.xlsx"
  );

  res.send(buffer);
});


// near merchants controller
const getNearbyMerchantsController = catchAsync(
  async (req: Request, res: Response) => {

    const user = req.user as JwtPayload;
    const result = await AdminService.getNearbyMerchants(req.query, user._id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Nearby merchants retrieved successfully",
      data: result,

    });

  }
);



const getAllMerchants = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllMerchants(req.query, req.user); // req.user পাঠানো
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All merchants Retrieved Successfully",
    data: result.allmerchants,
    pagination: result.pagination,
  });
});



//=============== mercent export ===================//
const exportMerchants = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any; // ✅ auth user

  const buffer = await AdminService.exportMerchants(
    req.query,
    user // ✅ pass user
  );

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=merchants.xlsx"
  );

  res.status(200).send(buffer);
});

// ======== customer crue operations ======== //

//=== singel customer details ===//

const getSingleCustomer = catchAsync(async (req, res) => {
  const result = await AdminService.getSingleCustomer(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Customer retrieved successfully",
    data: result,
  });
});

//===== update customer ======//
const updateCustomer = catchAsync(async (req, res) => {
  const id = req.params.id;

  // First extract body
  let bodyData: any = req.body;

  // If form-data contains "data" JSON string → parse to real object
  if (bodyData.data) {
    bodyData = JSON.parse(bodyData.data);
  }

  // Now handle uploaded image
  const files = req.files as
    | { [key: string]: Express.Multer.File[] }
    | undefined;

  if (files?.image?.length) {
    bodyData.profile = files.image[0].path;
  }

  console.log("🔥 FINAL PAYLOAD =>", bodyData);

  const result = await AdminService.updateCustomer(id, bodyData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Customer updated successfully",
    data: result,
  });
});

//===== delete customer ======//
const deleteCustomer = catchAsync(async (req, res) => {
  await AdminService.deleteCustomer(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Customer deleted successfully",
    data: null,
  });
});

//===== customer status update ======//
const updateCustomerStatus = catchAsync(async (req, res) => {
  const result = await AdminService.updateCustomerStatus(
    req.params.id,
    req.body.status
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Customer status updated successfully",
    data: result,
  });
});

//================= mercent crue operations ===================//

//=== singel merchant details ===//
const getSingleMerchant = catchAsync(async (req, res) => {
  const result = await AdminService.getSingleMerchant(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant retrieved successfully",
    data: result,
  });
});

//===== update merchant ======//

const updateMerchant = catchAsync(async (req, res) => {
  const id = req.params.id;

  // All JSON data from form-data comes as strings
  // So we need to parse them
  let payload: any = { ...req.body };

  // If data object is string, parse it
  if (payload.data) {
    payload = JSON.parse(payload.data);
  }

  // Handle files
  const files = req.files as
    | { [key: string]: Express.Multer.File[] }
    | undefined;

  if (files?.image && files.image.length > 0) {
    payload.profile = files.image[0].path; // Attach image path to payload
  }

  const result = await AdminService.updateMerchant(id, payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant updated successfully",
    data: result,
  });
});

//===== delete merchant ======//
const deleteMerchant = catchAsync(async (req, res) => {
  await AdminService.deleteMerchant(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant deleted successfully",
  });
});

//===== merchant status update ======//

const updateMerchantStatus = catchAsync(async (req, res) => {
  const result = await AdminService.updateMerchantStatus(
    req.params.id,
    req.body.status
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant status updated successfully",
    data: result,
  });
});


const updateMerchantApproveStatus = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload
  const result = await AdminService.updateMerchantApproveStatus(
    req.params.id,
    req.body.approveStatus,
    user._id
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant approve status updated successfully",
    data: result,
  });
});



const getCustomerSellDetails = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await AdminService.getCustomerSellDetails(userId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Customer sell list retrieved successfully",
    data: result.data,
    pagination: result.pagination,
  });
});


const getMerchantCustomerStats = catchAsync(async (req: Request, res: Response) => {
  const { merchantId } = req.params;

  const result = await AdminService.getMerchantCustomerStats(
    merchantId,
    req.query
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Merchant customer stats retrieved successfully",
    data: result.data,
    pagination: result.pagination,
  });
});



export const AdminController = {
  deleteAdmin,
  createAdmin,
  getAdmin,
  updateUserStatus,
  getAllCustomers,
  exportCustomers,
  getAllMerchants,

  getSingleCustomer,
  updateCustomer,
  deleteCustomer,
  updateCustomerStatus,

  getSingleMerchant,
  updateMerchant,
  deleteMerchant,
  updateMerchantStatus,
  updateMerchantApproveStatus,
  exportMerchants,


  getNearbyMerchantsController,

  getCustomerSellDetails,
  getMerchantCustomerStats
};
