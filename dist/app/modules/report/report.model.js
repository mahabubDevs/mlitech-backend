"use strict";
// import mongoose, { Schema } from "mongoose";
// import { IReport, ReportModel, REPORT_STATUS } from "./report.interface";
// const reportSchema = new Schema<IReport, ReportModel>(
//   {
//     reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
//     reportedUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
//     reason: { type: String, required: true },
//     warning: { type: String, default: null },
//     status: { type: String, enum: Object.values(REPORT_STATUS), default: REPORT_STATUS.PENDING },
//     adminActionBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
//   },
//   { timestamps: true }
// );
// reportSchema.virtual("id").get(function () {
//   return this._id.toHexString();
// });
// reportSchema.statics.isExistReport = async function (reporterId: string, reportedUserId: string) {
//   return this.findOne({ reporter: reporterId, reportedUser: reportedUserId });
// };
// export const Report = mongoose.model<IReport, ReportModel>("Report", reportSchema);
