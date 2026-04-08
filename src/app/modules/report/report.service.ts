// import QueryBuilder from "../../../util/queryBuilder";
// import { REPORT_STATUS } from "./report.interface";
// import { Report,  } from "./report.model";
// import { Types } from "mongoose";



// const createReport = async (id: string, reportedUserId: string, reason: string) => {
//   const existing = await Report.isExistReport(id, reportedUserId);
//   if (existing) {
//     throw new Error("You have already reported this user.");
//   }
//   const report = await Report.create({ reporter: id, reportedUser: reportedUserId, reason });
//   return report;
// };

// const adminAction = async (id: string, status: REPORT_STATUS, warning?: string, adminId?: string) => {
//   const report = await Report.findById(id);
//   if (!report) throw new Error("Report not found");

//   report.status = status;
//   if (warning) report.warning = warning;
//   if (adminId) report.adminActionBy = new Types.ObjectId(adminId);
//   await report.save();
//   return report;
// };

// const getAllReports = async (query: Record<string, unknown>) => {
//   // Step 1: Base query
//   const reportQuery = Report.find();

//   // Step 2: Use QueryBuilder
//   const reportQueryBuilder = new QueryBuilder(reportQuery, query)
//     .search(["reason"]) // user চাইলে searchTerm দিয়ে reason search করতে পারবে
//     .filter()
//     .sort()
//     .paginate()
//     .fields()
//     .populate(
//       ["reporter", "reportedUser"],
//       {
//         reporter: "firstName lastName email",
//         reportedUser: "firstName lastName email",
//       }
//     );

//   // Step 3: Run query
//   const result = await reportQueryBuilder.modelQuery;

//   // Step 4: Get pagination info
//   const meta = await reportQueryBuilder.getPaginationInfo();

//   return { meta, data: result };
// };


// const getSingleReports = async (id:string) => {
//   const report = await Report.findById(id);
//   return Report.find().populate("reporter", "firstName lastName email").populate("reportedUser", "firstName lastName email");
// };

// export const ReportService = {
//   createReport,
//   adminAction,
//   getAllReports,
//   getSingleReports
// };
