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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExcelBuffer = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
/* ===========================
   Helper Function
=========================== */
const generateExcelBuffer = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { sheetName, columns, rows } = options;
    const workbook = new exceljs_1.default.Workbook();
    workbook.creator = "The Pigeon Hub";
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet(sheetName);
    /* ---------- Columns ---------- */
    worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key,
        width: col.width || 20,
    }));
    /* ---------- Rows ---------- */
    rows.forEach((row) => {
        worksheet.addRow(row);
    });
    /* ---------- Header Styling ---------- */
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.eachCell((cell) => {
        cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        };
    });
    /* ---------- Data Row Styling ---------- */
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1)
            return;
        row.eachCell((cell) => {
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });
    });
    /* ---------- Auto Filter ---------- */
    worksheet.autoFilter = {
        from: "A1",
        to: `${String.fromCharCode(64 + columns.length)}1`,
    };
    /* ---------- Generate Buffer ---------- */
    const arrayBuffer = yield workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
});
exports.generateExcelBuffer = generateExcelBuffer;
