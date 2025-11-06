import os from "os";
import { ServerHealth } from "./analytic.model";
import { IServerHealthQuery } from "./analytic.interface";
import { ApiLog } from "./analyticApi.model";
import { VideoCallAnalytics } from "./videoCall.model";

let lastIncident: Date | null = null;

const getServerData = async () => {
  const load = os.loadavg()[0];
  const uptimeSeconds = os.uptime();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memoryUsed = ((totalMem - freeMem) / totalMem) * 100;

  // Incident detection
  if (load > 2 || memoryUsed > 80) {
    lastIncident = new Date();
    await ServerHealth.create({
      uptimePercentage: "100%",
      load: load.toFixed(2),
      memoryUsed: memoryUsed.toFixed(2) + "%",
      uptimeSeconds,
      lastIncident: lastIncident.toISOString(),
    });
  }

  const secondsIn24h = 24 * 60 * 60;
  let uptimePercentage = (uptimeSeconds / secondsIn24h) * 100;
  if (uptimePercentage > 100) uptimePercentage = 100;

  return {
    uptimePercentage: uptimePercentage.toFixed(2) + "%",
    load: load.toFixed(2),
    memoryUsed: memoryUsed.toFixed(2) + "%",
    uptimeHours: (uptimeSeconds / 3600).toFixed(2),
    lastIncident: lastIncident ? lastIncident.toISOString() : "No incidents",
  };
};

// Get server logs with filtering & pagination

const getServerLogs = async (query: IServerHealthQuery) => {
  const { startDate, endDate, minLoad, maxLoad, page = 1, limit = 50 } = query;

  const filter: any = {};
  if (startDate) filter.createdAt = { $gte: new Date(startDate) };
  if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
  if (minLoad) filter.load = { ...filter.load, $gte: minLoad };
  if (maxLoad) filter.load = { ...filter.load, $lte: maxLoad };

  const skip = (page - 1) * limit;
  const logs = await ServerHealth.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  const total = await ServerHealth.countDocuments(filter);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// API latency measurement (internal)
const getApiLatency = async () => {
  const start = process.hrtime();
  try {
    await getServerData(); // internal call
  } catch (err) {
    // ignore
  }
  const diff = process.hrtime(start);
  const latencyMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

  return {
    latencyMs,
    latencyTarget: "<100ms",
  };
};



const getErrorRateLast60Minutes = async () => {
  const now = new Date();
  const past60Min = new Date(now.getTime() - 60 * 60 * 1000); // last 60 minutes

  // Total requests
  const totalRequests = await ApiLog.countDocuments({ createdAt: { $gte: past60Min } });

  // Error requests (statusCode >= 400)
  const errorRequests = await ApiLog.countDocuments({
    createdAt: { $gte: past60Min },
    statusCode: { $gte: 400 },
  });

  const errorRate = totalRequests ? ((errorRequests / totalRequests) * 100).toFixed(2) : "0";

  return {
    totalRequests,
    errorRequests,
    errorRate: errorRate + "%",
    timeframe: "last 60 minutes",
  };
};




const saveMetrics = async (payload: any) => {
  const doc = await VideoCallAnalytics.create(payload);
  return doc;
};


const getCallMetrics = async () => {
  const metrics = await VideoCallAnalytics.aggregate([
    {
      $group: {
        _id: null,
        avgQuality: { $avg: "$qualityScore" },
        avgBitrate: { $avg: "$bitrate" },
        avgPacketLoss: { $avg: "$packetLoss" },
      }
    }
  ]);

  return metrics[0] || { avgQuality: 0, avgBitrate: 0, avgPacketLoss: 0 };
};

// Crash-free users percentage
const getCrashFreeUsers = async () => {
  const total = await VideoCallAnalytics.countDocuments();
  const crashed = await VideoCallAnalytics.countDocuments({ crashed: true });

  const crashFreePercentage = total ? ((total - crashed) / total) * 100 : 100;

  return { totalUsers: total, crashFreePercentage: crashFreePercentage.toFixed(2) + "%" };
};

// App version distribution
const getAppVersionStats = async () => {
  const stats = await VideoCallAnalytics.aggregate([
    {
      $group: {
        _id: "$appVersion",
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return stats.map(item => ({ appVersion: item._id, users: item.count }));
};



export const ServerHealthService = {
  getServerData,
  getServerLogs,
  getApiLatency,
  getErrorRateLast60Minutes,


  saveMetrics,
  getCallMetrics,
  getCrashFreeUsers,
  getAppVersionStats
};
