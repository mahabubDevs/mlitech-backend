"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationLevelEnum = exports.PoliticsEnum = exports.ChildrenEnum = exports.GenderEnum = exports.HabitEnum = exports.InterestedInEnum = exports.DatingIntentionEnum = void 0;
// Dating
var DatingIntentionEnum;
(function (DatingIntentionEnum) {
    DatingIntentionEnum["LIFE_PARTNER"] = "Life partner";
    DatingIntentionEnum["LONG_TERM"] = "Long-Term Relationship";
    DatingIntentionEnum["SHORT_TERM"] = "Short-time Relationship";
    DatingIntentionEnum["DOES_NOT_MATTER"] = "Does Not Matter";
})(DatingIntentionEnum || (exports.DatingIntentionEnum = DatingIntentionEnum = {}));
// Interested In
var InterestedInEnum;
(function (InterestedInEnum) {
    InterestedInEnum["MAN"] = "Man";
    InterestedInEnum["WOMEN"] = "Women";
    InterestedInEnum["NON_BINARY"] = "NonBinary";
    InterestedInEnum["EVERYONE"] = "Everyone";
})(InterestedInEnum || (exports.InterestedInEnum = InterestedInEnum = {}));
// Habit (Drinking / Smoking / Marijuana)
var HabitEnum;
(function (HabitEnum) {
    HabitEnum["YES"] = "Yes";
    HabitEnum["NO"] = "No";
    HabitEnum["OCCASIONALLY"] = "Occasionally";
})(HabitEnum || (exports.HabitEnum = HabitEnum = {}));
// Gender
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["MAN"] = "Man";
    GenderEnum["WOMEN"] = "Women";
    GenderEnum["NON_BINARY"] = "Non-Binary";
    GenderEnum["TRANS_MAN"] = "Trans Man";
    GenderEnum["TRANS_WOMAN"] = "Trans Woman";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
// Children
var ChildrenEnum;
(function (ChildrenEnum) {
    ChildrenEnum["YES"] = "Yes";
    ChildrenEnum["NO"] = "No";
    ChildrenEnum["SOMEDAY"] = "Someday";
    ChildrenEnum["PREFER_NOT"] = "Prefer not to say";
})(ChildrenEnum || (exports.ChildrenEnum = ChildrenEnum = {}));
// Politics
var PoliticsEnum;
(function (PoliticsEnum) {
    PoliticsEnum["LIBERAL"] = "Liberal";
    PoliticsEnum["CONSERVATIVE"] = "Conservative";
    PoliticsEnum["MODERATE"] = "Moderate";
    PoliticsEnum["NOT_POLITICAL"] = "Not political";
    PoliticsEnum["OTHER"] = "Other";
})(PoliticsEnum || (exports.PoliticsEnum = PoliticsEnum = {}));
// Education
var EducationLevelEnum;
(function (EducationLevelEnum) {
    EducationLevelEnum["HIGH_SCHOOL"] = "High School";
    EducationLevelEnum["UNDERGRAD"] = "Undergrad";
    EducationLevelEnum["POSTGRAD"] = "Postgrad";
    EducationLevelEnum["PREFER_NOT"] = "Prefer not to say";
})(EducationLevelEnum || (exports.EducationLevelEnum = EducationLevelEnum = {}));
