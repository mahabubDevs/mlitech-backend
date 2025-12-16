import colors from "colors";
import { Server } from "socket.io";
import { logger } from "../shared/logger";
import { User } from "../app/modules/user/user.model";

const socket = (io: Server) => {
  io.on("connection", (socket) => {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers.token;

    if (!token) {
      socket.emit("auth_error", "token is required");

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
