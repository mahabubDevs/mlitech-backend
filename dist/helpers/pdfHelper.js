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
const pdfkit_1 = __importDefault(require("pdfkit"));
const pdfDoc = (pigeons) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ margin: 20, size: "A4", layout: "portrait" });
        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", reject);
        // Title
        doc.fontSize(18).font("Helvetica-Bold").text("Pigeon List", { align: "center" });
        doc.moveDown(1);
        // Table Headers
        const headers = [
            "Ring No",
            "Name",
            "Country",
            "BirthYear",
            "Short Info",
            "Breeder",
            "Color",
            "Pattern",
            "Father Rating",
            "Mother Rating",
            "Gender",
            "Status",
            "Location",
            "Racing Rating",
            "Notes",
            "Results",
            "Father Ring",
            "Mother Ring"
        ];
        const colWidths = [55, 60, 60, 50, 70, 60, 50, 50, 60, 60, 55, 55, 55, 60, 60, 55, 65, 65];
        let startX = doc.x;
        let y = doc.y;
        // --- Header Row ---
        let x = startX;
        headers.forEach((h, i) => {
            doc.font("Helvetica-Bold").fontSize(8).text(h, x, y, { width: colWidths[i], align: "left" });
            x += colWidths[i];
        });
        y += 15;
        // --- Data Rows ---
        pigeons.forEach((p) => {
            var _a, _b;
            const row = [
                p.ringNumber,
                p.name,
                p.country,
                p.birthYear,
                p.shortInfo,
                p.breeder,
                p.color,
                p.pattern,
                p.fatherRating,
                p.motherRating,
                p.gender,
                p.status,
                p.location,
                p.racingRating,
                p.notes,
                p.results,
                ((_a = p.fatherRingId) === null || _a === void 0 ? void 0 : _a.ringNumber) || p.fatherRingId || "",
                ((_b = p.motherRingId) === null || _b === void 0 ? void 0 : _b.ringNumber) || p.motherRingId || ""
            ];
            let x = startX;
            row.forEach((val, i) => {
                doc.font("Helvetica").fontSize(8).text((val === null || val === void 0 ? void 0 : val.toString()) || "", x, y, { width: colWidths[i], align: "left" });
                x += colWidths[i];
            });
            y += 15;
            // --- Page break handling ---
            if (y > 750) {
                doc.addPage();
                y = doc.y;
            }
        });
        doc.end();
    });
});
exports.default = pdfDoc;
