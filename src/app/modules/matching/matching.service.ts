// src/app/modules/matching/matching.service.ts
import { User } from "../user/user.model";
import { Matching } from "./matching.model";
import QueryBuilder from "../../../util/queryBuilder";
import { UserPreference } from "../preferences/preferences.model";

// Discover users (skip excluded)
// const discoverUsersFromDB = async (userId: string, query: any) => {
//   // 1. Skip list বের করা
//   const skippedDocs = await Matching.find({ userId, status: "CALLED" }).select("targetUserId");
//   const skippedIds = skippedDocs.map(doc => doc.targetUserId);

//   // 2. Current user এর preferences বের করা
//   const preferences = await UserPreference.findOne({ userId });
//   if (!preferences) {
//     throw new Error("User preferences not set");
//   }

//   // 3. Match conditions বানানো
//   const andConditions: any[] = [
//     { _id: { $nin: [...skippedIds, userId] } } // নিজের প্রোফাইল + skipped বাদ
//   ];

//   const orConditions: any[] = [];

//   // ✅ Must match (AND)
//   if (preferences.interestedIn) {
//     andConditions.push({ gender: { $regex: new RegExp(preferences.interestedIn, "i") } });
//   }

//   if (preferences.minHeight && preferences.maxHeight) {
//     andConditions.push({ height: { $gte: preferences.minHeight, $lte: preferences.maxHeight } });
//   }

//   if (preferences.minAge && preferences.maxAge) {
//     andConditions.push({ age: { $gte: preferences.minAge, $lte: preferences.maxAge } });
//   }

//   // ✅ Optional (OR)
//   if (preferences.languages) {
//     orConditions.push({ languages: { $regex: new RegExp(preferences.languages, "i") } });
//   }

//   if (preferences.smoking !== undefined) {
//     orConditions.push({ smoking: preferences.smoking });
//   }

//   if (preferences.drinking !== undefined) {
//     orConditions.push({ drinking: preferences.drinking });
//   }

//   // Final match condition
//   const matchConditions: any = { $and: andConditions };
//   if (orConditions.length > 0) {
//     matchConditions.$and.push({ $or: orConditions });
//   }

//   // 4. QueryBuilder ব্যবহার
//   let baseQuery = User.find(matchConditions);

//   const qb = new QueryBuilder(baseQuery, query);
//   qb.search(["firstName", "lastName", "email"])
//     .filter()
//     .sort()
//     .paginate()
//     .fields();

//   const data = await qb.modelQuery.lean();
//   const pagination = await qb.getPaginationInfo();

//   return { pagination, data };
// };



const discoverUsersFromDB = async (userId: string, query: any) => {
  // 1. Skip list বের করা
  const skippedDocs = await Matching.find({ userId, status: "CALLED" }).select("targetUserId");
  const skippedIds = skippedDocs.map(doc => doc.targetUserId);

  // 2. Current user এর preferences বের করা
  const preferences = await UserPreference.findOne({ userId });
  if (!preferences) {
    throw new Error("User preferences not set");
  }

  // 3. Match conditions বানানো
  const andConditions: any[] = [
    { _id: { $nin: [...skippedIds, userId] } } // নিজের প্রোফাইল + skipped বাদ
  ];

  const orConditions: any[] = [];

  // ✅ Must match (AND)
  if (preferences.interestedIn) {
    andConditions.push({ gender: { $regex: new RegExp(preferences.interestedIn, "i") } });
  }

  if (preferences.minHeight && preferences.maxHeight) {
    andConditions.push({ height: { $gte: preferences.minHeight, $lte: preferences.maxHeight } });
  }

  if (preferences.minAge && preferences.maxAge) {
    andConditions.push({ age: { $gte: preferences.minAge, $lte: preferences.maxAge } });
  }

  // ✅ Optional (OR)
  if (preferences.languages) {
    orConditions.push({ languages: { $regex: new RegExp(preferences.languages, "i") } });
  }

  if (preferences.smoking !== undefined) {
    orConditions.push({ smoking: preferences.smoking });
  }

  if (preferences.drinking !== undefined) {
    orConditions.push({ drinking: preferences.drinking });
  }

  // Final match condition
  const matchConditions: any = { $and: andConditions };
  if (orConditions.length > 0) {
    matchConditions.$and.push({ $or: orConditions });
  }

  // 4. Distance filter (lat/lng)
  if (query.lat && query.lng) {
    const lat = parseFloat(query.lat as string);
    const lng = parseFloat(query.lng as string);
    const distance = query.distance ? parseInt(query.distance as string) : 5000; // default 5km

    // GeoJSON conversion for string location "lat,lng"
    matchConditions.$and.push({
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat], // [lng, lat] format
          },
          $maxDistance: distance,
        },
      },
    });
  }

  // 5. QueryBuilder ব্যবহার
  let baseQuery = User.find(matchConditions);

  const qb = new QueryBuilder(baseQuery, query);
  qb.search(["firstName", "lastName", "email"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = await qb.modelQuery.lean();
  const pagination = await qb.getPaginationInfo();

  return { pagination, data };
};


// Skip user
const skipUserInDB = async (userId: string, targetUserId: string) => {
  const exists = await Matching.findOne({ userId, targetUserId, status: "CALLED" });
  if (exists) return exists;

  const doc = await Matching.create({ userId, targetUserId, status: "CALLED" });
  return doc;
};


// User clicks match button
const matchUserInDB = async (userId: string, targetUserId: string) => {
  // Check if targetUser already pending current user
  const pending = await Matching.findOne({ userId: targetUserId, targetUserId: userId, status: "PENDING" });
  if (pending) {
    // Update both to MATCHED
    await Matching.updateMany(
      { $or: [
        { userId, targetUserId },
        { userId: targetUserId, targetUserId: userId }
      ]},
      { status: "MATCHED" }
    );
    return { isMatched: true };
  }

  // Otherwise, create pending
  const exists = await Matching.findOne({ userId, targetUserId });
  if (exists) return { isMatched: false };

  await Matching.create({ userId, targetUserId, status: "PENDING" });
  return { isMatched: false };
};

// Get matched users
const getMatchedUsersFromDB = async (userId: string) => {
  const matchedDocs = await Matching.find({ 
    $or: [{ userId }, { targetUserId: userId }],
    status: "MATCHED"
  });

  // Map to user info
  const userIds = matchedDocs.map(doc => (doc.userId.toString() === userId ? doc.targetUserId : doc.userId));
  const users = await User.find({ _id: { $in: userIds } })
  .select("firstName lastName profile")
  .lean();
  return users;
};

export const MatchingService = {
   discoverUsersFromDB,
    skipUserInDB,
    matchUserInDB,
    getMatchedUsersFromDB
 };
