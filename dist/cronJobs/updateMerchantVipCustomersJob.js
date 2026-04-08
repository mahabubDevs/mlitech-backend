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
exports.downgradeInactiveTiers = void 0;
const date_fns_1 = require("date-fns");
const digitalCard_model_1 = require("../app/modules/customer/digitalCard/digitalCard.model");
const tier_model_1 = require("../app/modules/mercent/point&TierSystem/tier.model");
// 5  মিনিটের  আপডেট করা হয়েছে
// export const downgradeInactiveTiers = async () => {
//   try {
//     const fiveMinutesAgo = subMinutes(new Date(), 5);
//     console.log("Checking for inactive digital cards older than:", fiveMinutesAgo);
//     // 🔹 Find all DigitalCards inactive for 5 minutes
//     const inactiveCards = await DigitalCard.find({
//       updatedAt: { $lt: fiveMinutesAgo },
//     });
//     if (!inactiveCards.length) {
//       console.log("No inactive digital cards found.");
//       return;
//     }
//     console.log(`🛑 Found ${inactiveCards.length} inactive digital card(s):`);
//     inactiveCards.forEach((card) =>
//       console.log(
//         `  - CardCode: ${card.cardCode}, Merchant: ${card.merchantId}, LifeTimePoints: ${card.lifeTimeEarnPoints}`
//       )
//     );
//     for (const card of inactiveCards) {
//       // 🔹 Fetch all tiers for this merchant
//       const merchantTiers = await Tier.find({ admin: card.merchantId, isActive: true })
//         .sort({ pointsThreshold: 1 }) // ascending
//         .lean();
//       if (!merchantTiers.length) continue;
//       console.log(`🔹 Merchant ${card.merchantId} tiers:`);
//       merchantTiers.forEach((t, idx) =>
//         console.log(`   [${idx}] ${t.name} (PointsThreshold: ${t.pointsThreshold})`)
//       );
//       // 🔹 Find current tier index
//       let currentTierIndex = 0;
//       for (let i = 0; i < merchantTiers.length; i++) {
//         if (card.lifeTimeEarnPoints >= merchantTiers[i].pointsThreshold) {
//           currentTierIndex = i;
//         } else {
//           break;
//         }
//       }
//       // 🔹 If already lowest tier, skip
//       if (currentTierIndex === 0) {
//         console.log(
//           `ℹ️ Card ${card.cardCode} already at or below lowest tier threshold, skipping downgrade.`
//         );
//         continue;
//       }
//       // 🔹 Downgrade one step
//       const lowerTier = merchantTiers[currentTierIndex - 1];
//       const oldPoints = card.lifeTimeEarnPoints;
//       card.lifeTimeEarnPoints = lowerTier.pointsThreshold;
//       card.tier = lowerTier.name; // update tier field
//       await card.save();
//       console.log(
//         `⬇️ Card ${card.cardCode} downgraded: LifeTimePoints ${oldPoints} → ${card.lifeTimeEarnPoints}, New Tier = ${card.tier}`
//       );
//     }
//     console.log("🎉 Inactive tier downgrade process completed.");
//   } catch (err) {
//     console.error("Error in downgradeInactiveTiers:", err);
//   }
// };
// 6 মাসের আপডেট করা হয়েছে
const downgradeInactiveTiers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fiveMinutesAgo = (0, date_fns_1.subMinutes)(new Date(), 5);
        console.log("Checking for inactive digital cards older than:", fiveMinutesAgo);
        const inactiveCards = yield digitalCard_model_1.DigitalCard.find({
            updatedAt: { $lt: fiveMinutesAgo },
        });
        // const sixMonthsAgo = subMonths(new Date(), 6);
        // console.log("Checking for inactive digital cards older than:", sixMonthsAgo);
        // // 🔹 Find all DigitalCards inactive for 6 months
        // const inactiveCards = await DigitalCard.find({
        //   updatedAt: { $lt: sixMonthsAgo },
        // });
        if (!inactiveCards.length) {
            console.log("No inactive digital cards found.");
            return;
        }
        console.log(`🛑 Found ${inactiveCards.length} inactive digital card(s):`);
        inactiveCards.forEach((card) => console.log(`  - CardCode: ${card.cardCode}, Merchant: ${card.merchantId}, LifeTimePoints: ${card.lifeTimeEarnPoints}`));
        for (const card of inactiveCards) {
            // 🔹 Fetch all tiers for this merchant
            const merchantTiers = yield tier_model_1.Tier.find({ admin: card.merchantId, isActive: true })
                .sort({ pointsThreshold: 1 }) // ascending
                .lean();
            if (!merchantTiers.length)
                continue;
            console.log(`🔹 Merchant ${card.merchantId} tiers:`);
            merchantTiers.forEach((t, idx) => console.log(`   [${idx}] ${t.name} (PointsThreshold: ${t.pointsThreshold})`));
            // 🔹 Find current tier index based on lifetime points
            let currentTierIndex = 0;
            for (let i = 0; i < merchantTiers.length; i++) {
                if (card.lifeTimeEarnPoints >= merchantTiers[i].pointsThreshold) {
                    currentTierIndex = i;
                }
                else {
                    break;
                }
            }
            // 🔹 If already lowest tier, skip
            if (currentTierIndex === 0) {
                console.log(`ℹ️ Card ${card.cardCode} already at or below lowest tier threshold, skipping downgrade.`);
                continue;
            }
            // 🔹 Downgrade one step
            const lowerTier = merchantTiers[currentTierIndex - 1];
            const oldPoints = card.lifeTimeEarnPoints;
            card.lifeTimeEarnPoints = lowerTier.pointsThreshold;
            card.tier = lowerTier.name; // update tier field
            yield card.save();
            console.log(`⬇️ Card ${card.cardCode} downgraded: LifeTimePoints ${oldPoints} → ${card.lifeTimeEarnPoints}, New Tier = ${card.tier}`);
        }
        console.log("🎉 Inactive tier downgrade process completed.");
    }
    catch (err) {
        console.error("Error in downgradeInactiveTiers:", err);
    }
});
exports.downgradeInactiveTiers = downgradeInactiveTiers;
