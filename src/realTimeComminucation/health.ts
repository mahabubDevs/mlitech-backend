import WebSocket from "ws";
import { ServerHealthService } from "../app/modules/analytics-real-time-server/analytic.service";

interface WSMessage {
  type: string;
  data: any;
}

// Health handler
export async function healthHandler(ws: WebSocket, msg: WSMessage) {
  try {
    if (msg.type !== "health-request") return;

    // server health data
    const serverData = await ServerHealthService.getServerData();
    const apiLatency = await ServerHealthService.getApiLatency();
    const errorRate = await ServerHealthService.getErrorRateLast60Minutes();

    // Send to the requesting client
    ws.send(JSON.stringify({
      type: "health-response",
      data: {
        ...serverData,
        apiLatency,
        apiErrorRate: errorRate
      }
    }));
  } catch (err) {
    console.error("Health handler error:", err);
    ws.send(JSON.stringify({ type: "error", data: "Failed to fetch server health" }));
  }
}
