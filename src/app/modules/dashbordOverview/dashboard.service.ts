import { User } from "../user/user.model";




// ✅ Age distribution
const getAgeDistribution = async () => {
  const rawData = await User.aggregate([
    {
      $bucket: {
        groupBy: "$age",
        boundaries: [18, 25, 35, 45,55, 200],
        default: "Unknown",
        output: { count: { $sum: 1 } },
      },
    },
  ]);

  const formatted = {
    "18-24": 0,
    "25-34": 0,
    "35-44": 0,
    "45-54": 0,
    "55+": 0,
    Unknown: 0,
  };

  rawData.forEach(item => {
    if (item._id === 18) formatted["18-24"] = item.count;
    else if (item._id === 25) formatted["25-34"] = item.count;
    else if (item._id === 31) formatted["35-44"] = item.count;
    else if (item._id === 41) formatted["45-54"] = item.count;
    else if (item._id === 41) formatted["45-54"] = item.count;
    else if (item._id === 41) formatted["55+"] = item.count;
    else if (item._id === "Unknown") formatted.Unknown = item.count;
  });

  return formatted;
};

// Ethnicity Distribution

const getEthnicityDistribution = async () => {
  const options = [
    "Black / Africa Decent",
    "East Asia",
    "Hispanic/Latino",
    "Middle Eastern",
    "Native American",
    "Pacific Islander",
    "South Asian",
    "Southeast Asian",
    "White Caucasion",
    "Other",
    "Open to All",
    "Pisces",
  ];

  const rawData = await User.aggregate([
    {
      $match: { ethnicity: { $in: options } } // Optional: only known options
    },
    {
      $group: {
        _id: "$ethnicity",
        count: { $sum: 1 }
      }
    }
  ]);

  // Initialize formatted object
  const formatted: Record<string, number> = {};
  options.forEach(opt => formatted[opt] = 0);
  formatted["Unknown"] = 0;

  rawData.forEach(item => {
    if (options.includes(item._id)) formatted[item._id] = item.count;
    else formatted["Unknown"] += item.count;
  });

  return formatted;
};

// Gender Distribution

const getGenderDistribution = async () => {
  const options = [
    "MAN",
    "WOMEN",
    "NON-BINARY",
    "TRANS MAN",
    "TRANS WOMAN"
  ];

  const rawData = await User.aggregate([
    {
      $match: { gender: { $in: options } } // optional filter
    },
    {
      $group: {
        _id: "$gender",
        count: { $sum: 1 }
      }
    }
  ]);

  // Total users
  const totalUsers = await User.countDocuments();
 
  // Initialize formatted object
  const formatted: Record<string, { total: number; percentage: string }> = {};
  options.forEach(opt => formatted[opt] = { total: 0, percentage: "0%" });
  formatted["Unknown"] = { total: 0, percentage: "0%" };

  rawData.forEach(item => {
    if (options.includes(item._id)) {
      formatted[item._id].total = item.count;
      formatted[item._id].percentage = ((item.count / totalUsers) * 100).toFixed(2) + "%";
    } else {
      formatted["Unknown"].total += item.count;
    }
  });

  // If Unknown exists, calculate percentage
  if (formatted["Unknown"].total > 0) {
    formatted["Unknown"].percentage = ((formatted["Unknown"].total / totalUsers) * 100).toFixed(2) + "%";
  }

  return formatted;
};


const getMonthlySignups = async () => {
  const monthlySignups = await User.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalUsers: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const formatted = monthlySignups.map(item => ({
    year: item._id.year,
    month: item._id.month,
    totalUsers: item.totalUsers,
  }));

  return formatted;
};


export const DashboardService = {
  getAgeDistribution,
  getEthnicityDistribution,
  getGenderDistribution,
  getMonthlySignups
};
