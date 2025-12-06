import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import { MemberService } from "./mercentCustomerList.service";


const getAllMembers = catchAsync(async (req, res) => {
  const merchantId = (req.user as any)?._id;

  const result = await MemberService.getAllMembers(merchantId, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All members fetched successfully",
    data: result.members,
    // pagination: result.pagination,
  });
});

const getSingleMember = catchAsync(async (req, res) => {
  const merchantId = (req.user as any)?._id;
  const userId = req.params.userId;

  const member = await MemberService.getSingleMember(merchantId, userId);

  if (!member) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Member not found",
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Member fetched successfully",
    data: member,
  });
});

export const MemberController = {
  getAllMembers,
  getSingleMember,
};
