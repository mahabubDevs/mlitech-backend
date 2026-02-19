
import mongoose from "mongoose";
import { subMinutes, subMonths } from "date-fns";
import { DigitalCard } from "../app/modules/customer/digitalCard/digitalCard.model";
import { Tier } from "../app/modules/mercent/point&TierSystem/tier.model";

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

export const downgradeInactiveTiers = async () => {
  try {
    const sixMonthsAgo = subMonths(new Date(), 6);

    console.log("Checking for inactive digital cards older than:", sixMonthsAgo);

    // 🔹 Find all DigitalCards inactive for 6 months
    const inactiveCards = await DigitalCard.find({
      updatedAt: { $lt: sixMonthsAgo },
    });

    if (!inactiveCards.length) {
      console.log("No inactive digital cards found.");
      return;
    }

    console.log(`🛑 Found ${inactiveCards.length} inactive digital card(s):`);
    inactiveCards.forEach((card) =>
      console.log(
        `  - CardCode: ${card.cardCode}, Merchant: ${card.merchantId}, LifeTimePoints: ${card.lifeTimeEarnPoints}`
      )
    );

    for (const card of inactiveCards) {
      // 🔹 Fetch all tiers for this merchant
      const merchantTiers = await Tier.find({ admin: card.merchantId, isActive: true })
        .sort({ pointsThreshold: 1 }) // ascending
        .lean();

      if (!merchantTiers.length) continue;

      console.log(`🔹 Merchant ${card.merchantId} tiers:`);
      merchantTiers.forEach((t, idx) =>
        console.log(`   [${idx}] ${t.name} (PointsThreshold: ${t.pointsThreshold})`)
      );

      // 🔹 Find current tier index based on lifetime points
      let currentTierIndex = 0;
      for (let i = 0; i < merchantTiers.length; i++) {
        if (card.lifeTimeEarnPoints >= merchantTiers[i].pointsThreshold) {
          currentTierIndex = i;
        } else {
          break;
        }
      }

      // 🔹 If already lowest tier, skip
      if (currentTierIndex === 0) {
        console.log(
          `ℹ️ Card ${card.cardCode} already at or below lowest tier threshold, skipping downgrade.`
        );
        continue;
      }

      // 🔹 Downgrade one step
      const lowerTier = merchantTiers[currentTierIndex - 1];
      const oldPoints = card.lifeTimeEarnPoints;
      card.lifeTimeEarnPoints = lowerTier.pointsThreshold;
      card.tier = lowerTier.name; // update tier field

      await card.save();

      console.log(
        `⬇️ Card ${card.cardCode} downgraded: LifeTimePoints ${oldPoints} → ${card.lifeTimeEarnPoints}, New Tier = ${card.tier}`
      );
    }

    console.log("🎉 Inactive tier downgrade process completed.");
  } catch (err) {
    console.error("Error in downgradeInactiveTiers:", err);
  }
};




