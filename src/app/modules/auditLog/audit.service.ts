
import { Schema, model } from "mongoose";
import { AuditLog } from "./audit.model";
import QueryBuilder from "../../../util/queryBuilder";
import { User } from "../user/user.model";
import { Types } from "mongoose";


const createLog = async (
  userIdOrEmail: string,
  actionType: string,
  details: string
) => {
  let userId: Types.ObjectId | undefined;
  let email: string | null = null;

  // ✅ যদি valid ObjectId হয়
  if (Types.ObjectId.isValid(userIdOrEmail)) {
    const user = await User.findById(userIdOrEmail).select("email");
    if (user) {
      userId = user._id;
      email = user?.email ?? null;

    }
  } else {
    // ✅ email হলে
    email = userIdOrEmail;
  }

  const log = await AuditLog.create({
    actionType,
    details,
    user: userId,
    email,
  });

  return log;
};


const getAllLogsExceptMerchant = async (query: Record<string, unknown>) => {
  const merchants = await User.find({ role: "merchant" }, { _id: 1 });
  const merchantIds = merchants.map(m => m._id.toString());

  const auditQuery = new QueryBuilder(
    AuditLog.find({
      $or: [
        { user: { $nin: merchantIds } },
        { user: { $exists: false } } // ✅ important
      ]
    }),
    query
  )
    .search(["actionType", "details"])
    .filter()
    .sort()
    .paginate();

  const result = await auditQuery.modelQuery;
  const pagination = await auditQuery.getPaginationInfo();

  return {
    meta: pagination,
    data: result,
  };
};



const getLogsByUserId = async (
  userId: string,
  query: Record<string, unknown>
) => {
  // 1️⃣ QueryBuilder দিয়ে search, filter, sort, paginate
  const auditQuery = new QueryBuilder(
    AuditLog.find({ user: userId }), // populate not needed
    query
  )
    .search(["actionType", "details"])
    .filter()
    .sort()
    .paginate()
    .fields();

  // 2️⃣ Data fetch
  const result = await auditQuery.modelQuery;

  // 3️⃣ Pagination info
  const pagination = await auditQuery.getPaginationInfo();

  // 4️⃣ Format response
  const formattedData = result.map((log: any) => ({
    _id: log._id,
    actionType: log.actionType,
    details: log.details,
    email: log.email,       // ✅ mail এখানে directly আছে
    createdAt: log.createdAt,
    // createdAt: log.createdAt
  }));

  return {
    meta: pagination,
    data: formattedData
  };
};



export const AuditService = {
  createLog,
  getAllLogsExceptMerchant,
  getLogsByUserId
};
