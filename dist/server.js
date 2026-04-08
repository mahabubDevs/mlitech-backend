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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const logger_1 = require("./shared/logger");
const colors_1 = __importDefault(require("colors"));
const socket_io_1 = require("socket.io");
const DB_1 = __importDefault(require("./DB"));
const socketHelper_1 = require("./helpers/socketHelper");
const cronJobs_1 = require("./cronJobs");
const cleanupSocket_1 = require("./util/cleanupSocket");
// uncaught exception
process.on("uncaughtException", (error) => {
    logger_1.errorLogger.error("uncaughtException Detected", error);
    process.exit(1);
});
let server;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // create super admin
            (0, DB_1.default)();
            yield mongoose_1.default.connect(config_1.default.database_url);
            logger_1.logger.info(colors_1.default.green("🚀 Database connected successfully"));
            yield (0, cronJobs_1.startCronJobs)();
            const port = typeof config_1.default.port === "number" ? config_1.default.port : Number(config_1.default.port);
            // server = app.listen(port, config.ip_address as string, () => {
            //   logger.info(
            //     colors.yellow(
            //       `♻️  Worker ${process.pid} listening on port:${config.port}`
            //     )
            //   );
            // });
            //socket
            server = app_1.default.listen(port, '0.0.0.0', () => {
                logger_1.logger.info(`Worker ${process.pid} listening on port:${config_1.default.port}`);
            });
            const io = new socket_io_1.Server(server, {
                pingTimeout: 60000,
                cors: {
                    origin: "*",
                },
            });
            socketHelper_1.socketHelper.socket(io);
            //@ts-ignore
            global.io = io;
            setInterval(() => {
                (0, cleanupSocket_1.cleanupStaleSockets)(io).catch(console.error);
            }, 5 * 60 * 1000);
        }
        catch (error) {
            logger_1.errorLogger.error(colors_1.default.red("🤢 Failed to connect Database"), error);
            process.exit(1);
        }
        // handle unhandledRejection
        process.on("unhandledRejection", (error) => {
            if (server) {
                server.close(() => {
                    logger_1.errorLogger.error("UnhandledRejection Detected", error);
                    process.exit(1);
                });
            }
            else {
                process.exit(1);
            }
        });
    });
}
// clustering logic
main();
// SIGTERM
process.on("SIGTERM", () => {
    logger_1.logger.info("SIGTERM IS RECEIVE");
    if (server)
        server.close();
});
