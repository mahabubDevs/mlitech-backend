import colors from "colors";
import { Server } from "socket.io";
import { logger } from "../shared/logger";
import { User } from "../app/modules/user/user.model";

const socket = (io: Server) => {
  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (!userId) {
      socket.emit("auth_error", "User ID is required");

      setTimeout(() => {
        socket.disconnect();
      }, 100);
      return;
    }
    // User is now online
    logger.info(colors.blue("A user connected"));

    //disconnect
    socket.on("disconnect", () => {
      logger.info(colors.red("A user disconnect"));
    });
  });
};
export const socketHelper = { socket };
