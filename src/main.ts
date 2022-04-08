import { LoggerFactory } from "./utils/logger-factory";
import { Logger } from "winston";
import { RadarrMediaService } from "./services/radarr-media-service";
import { BasicContext, TelegramBotService } from "./services/telegram-bot-service";
import { Constants } from "./utils/constants";
import { Bot } from "grammy";

const logger: Logger = LoggerFactory.getLogger("main");

async function start() {
  logger.info("Starting application");
  logger.info(`There are ${Constants.allowedUsers.length} allowed users`);
  const radarrMediaService = new RadarrMediaService();
  new TelegramBotService(radarrMediaService, new Bot<BasicContext>(Constants.botToken));
}

start();
