
import { Schema, model } from "mongoose";
import { AuditLog } from "./audit.model";
import QueryBuilder from "../../../util/queryBuilder";


const createLog = async (user: string, actionType: string, details: string) => {
  const log = await AuditLog.create({ user, actionType, details });
  return log;
};

const getAllLogs = async (query: Record<string, unknown>) => {
  const auditQuery = new QueryBuilder(
    AuditLog.find(),
    query
  )
    .search(["actionType", "user", "details"])
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
  getAllLogs,
};
