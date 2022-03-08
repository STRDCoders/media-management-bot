import { LoggerFactory } from "./utils/logger-factory";
import { Logger } from "winston";
import { RadarrMediaService } from "./services/radarr-media-service";
import { TelegramBotService } from "./services/telegram-bot-service";
import { Constants } from "./utils/constants";

const logger: Logger = LoggerFactory.getLogger("main");

async function start() {
  logger.info("Starting application");
  logger.info(`There are ${Constants.allowedUsers.length} allowed users`);
  const radarrMediaService = new RadarrMediaService();
  new TelegramBotService(radarrMediaService);
}

start();
