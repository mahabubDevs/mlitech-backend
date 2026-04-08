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
class QueryBuilder {
    constructor(modelQuery, query) {
        this.modelQuery = modelQuery;
        this.query = query;
    }
    //searching
    search(searchableFields) {
        var _a;
        if ((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.searchTerm) {
            this.modelQuery = this.modelQuery.find({
                $or: searchableFields.map(field => ({
                    [field]: {
                        $regex: this.query.searchTerm,
                        $options: 'i',
                    },
                })),
            });
        }
        return this;
    }
    //filtering
    // filtering
    // filtering
    //filtering
    filter() {
        const queryObj = Object.assign({}, this.query);
        const excludeFields = ['searchTerm', 'sort', 'page', 'limit', 'fields', "withLocked", "showHidden", "download"];
        excludeFields.forEach(el => delete queryObj[el]);
        // Boolean conversion for isActive
        Object.keys(queryObj).forEach(key => {
            if (queryObj[key] === "true")
                queryObj[key] = true;
            else if (queryObj[key] === "false")
                queryObj[key] = false;
        });
        console.log("Cleaned filter query:", queryObj);
        this.modelQuery = this.modelQuery.find(cleanObject(queryObj));
        return this;
    }
    //sorting
    sort() {
        var _a;
        let sortField = ((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.sort) || '-timestamp -createdAt';
        this.modelQuery = this.modelQuery.sort(sortField);
        return this;
    }
    //pagination
    paginate() {
        var _a, _b;
        let limit = Number((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.limit) || 10;
        let page = Number((_b = this === null || this === void 0 ? void 0 : this.query) === null || _b === void 0 ? void 0 : _b.page) || 1;
        let skip = (page - 1) * limit;
        this.modelQuery = this.modelQuery.skip(skip).limit(limit);
        return this;
    }
    //fields filtering
    fields() {
        var _a, _b;
        let fields = ((_b = (_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b.split(',').join(' ')) || '-__v';
        this.modelQuery = this.modelQuery.select(fields);
        return this;
    }
    //populating
    populate(populateFields, selectFields) {
        this.modelQuery = this.modelQuery.populate(populateFields.map(field => ({
            path: field,
            select: (selectFields === null || selectFields === void 0 ? void 0 : selectFields[field]) || '',
        })));
        return this;
    }
    //pagination information
    getPaginationInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const total = yield this.modelQuery.model.countDocuments(this.modelQuery.getFilter());
            const limit = Number((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.limit) || 10;
            const page = Number((_b = this === null || this === void 0 ? void 0 : this.query) === null || _b === void 0 ? void 0 : _b.page) || 1;
            const totalPage = Math.ceil(total / limit);
            return {
                total,
                limit,
                page,
                totalPage,
            };
        });
    }
}
function cleanObject(obj) {
    const cleaned = {};
    for (const key in obj) {
        const value = obj[key];
        // Skip null, undefined, empty string, empty array, or empty object
        if (value !== null &&
            value !== undefined &&
            value !== '' &&
            value !== "undefined" &&
            !(Array.isArray(value) && value.length === 0) &&
            !(typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) {
            cleaned[key] = value;
        }
    }
    return cleaned;
}
exports.default = QueryBuilder;
