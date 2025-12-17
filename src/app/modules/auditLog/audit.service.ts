
import { Schema, model } from "mongoose";
import { AuditLog } from "./audit.model";
import QueryBuilder from "../../../util/queryBuilder";
import { User } from "../user/user.model";


const createLog = async (user: string, actionType: string, details: string) => {
  const log = await AuditLog.create({ user, actionType, details });
  return log;
};

const getAllLogsExceptMerchant = async (query: Record<string, unknown>) => {
  // 1. সব merchant userId বের করো
  const merchants = await User.find({ role: "merchant" }, { _id: 1 });
  const merchantIds = merchants.map(m => m._id.toString());

  // 2. AuditLog থেকে merchant বাদ দিয়ে আনা
  const auditQuery = new QueryBuilder(
    AuditLog.find({ user: { $nin: merchantIds } }),
    query
  )
    .search(["actionType", "details"]) // searchable fields
    .filter()
    .sort()
    .paginate()
    .fields();

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
  const auditQuery = new QueryBuilder(
    AuditLog.find({ user: userId }),
    query
  )
    .search(["actionType", "details"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await auditQuery.modelQuery;
  const pagination = await auditQuery.getPaginationInfo();

  return {
    meta: pagination,
    data: result,
  };
};


export const AuditService = {
  createLog,
  getAllLogsExceptMerchant,
  getLogsByUserId
};
