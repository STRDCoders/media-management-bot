import { LoggerFactory } from "./utils/logger-factory";
import { Logger } from "winston";
import { RadarrMediaService } from "./services/radarr-media-service";

const logger: Logger = LoggerFactory.getLogger("main");

async function start() {
  logger.info("Starting application");
  const radarrMediaService = new RadarrMediaService();
  const data = await radarrMediaService.getDownloadQueue();
  logger.info(data);
}

start();
