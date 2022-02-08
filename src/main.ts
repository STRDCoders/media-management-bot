import { LoggerFactory } from "./utils/logger-factory";
import { Logger } from "winston";

const logger: Logger = LoggerFactory.getLogger("main");
logger.error("HEY");
