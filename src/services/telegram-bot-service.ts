import { Logger } from "winston";
import { LoggerFactory } from "../utils/logger-factory";
import { Constants } from "../utils/constants";
import { Bot, BotError, Context, session, SessionFlavor } from "grammy";
import { RadarrMediaService } from "./radarr-media-service";
import { MediaDownloadQueueItemTrackedStatus } from "./media-service";

const logger: Logger = LoggerFactory.getLogger("bot-service");

export type BasicContext = Context & SessionFlavor<SessionData>;

export enum Routes {
  queue = "/queue",
}

export enum SessionStateType {
  none = "none",
}

export interface SessionData {
  currentState: SessionStateType;
}

function initial(): SessionData {
  return { currentState: SessionStateType.none };
}

export class TelegramBotService {
  constructor(
    private radarrMediaService: RadarrMediaService,
    private bot: Bot<BasicContext> = new Bot(Constants.botToken)
  ) {
    this.initBotMiddleware();
    this.initBotCommands();
    this.bot.api.setMyCommands([
      {
        command: Routes.queue,
        description: "Download queue",
      },
    ]);
    this.bot.start();
  }

  private static async handleDebugLogging(ctx: BasicContext, next: Function) {
    logger.debug(`Received message from: '${ctx.chat!!.id}', with state: '${ctx.session.currentState}'`);
    return await next();
  }

  private static async handleGuard(ctx: BasicContext, next: Function) {
    if (ctx.chat && ctx.chat.id) {
      if (Constants.allowedUsers.includes(ctx.chat.id.toString(10))) {
        return await next();
      }
    }
    logger.error(`User ${ctx.from?.id} is not authorized`);
  }

  private static async handleSessionState(ctx: BasicContext, next: Function) {
    // In case the user switches a menu, we want to ignore state requests since they are not relevant & in some cases will cause the menu to re-appear
    if (!!ctx.callbackQuery?.data) {
      return await next();
    }
    switch (ctx.session.currentState) {
    }
    return await next();
  }

  private initBotMiddleware() {
    // Initial global middleware for bot
    this.bot.use(session({ initial }));
    this.bot.catch(async (errorHandler) => await this.handleError(errorHandler));
    this.bot.use(async (ctx: BasicContext, next: Function) => await TelegramBotService.handleDebugLogging(ctx, next));
    this.bot.use(async (ctx: BasicContext, next: Function) => await TelegramBotService.handleGuard(ctx, next));
    this.bot.use(async (ctx: BasicContext, next: Function) => await TelegramBotService.handleSessionState(ctx, next));
  }

  private initBotCommands() {
    this.bot.hears(Routes.queue, async (ctx: BasicContext, next: Function) => await this.handleQueueRequest(ctx, next));
  }

  private test = async (ctx: BasicContext, next: Function) => {
    await ctx.reply("test");
    return await next();
  };

  private handleError = async (errorHandler: BotError<BasicContext>) => {
    logger.error(`Error occurred: ${errorHandler.error}`);
    await errorHandler.ctx.reply("An error occurred. Please try again later.");
  };

  private async handleQueueRequest(ctx: BasicContext, next: Function) {
    logger.info(`User ${ctx.from?.id} requested the download queue`);
    const media = await this.radarrMediaService.getDownloadQueue();
    if (media.length > 0) {
      let message = "";
      for (const item of media) {
        message += Constants.bot.responses.queue.description(item.name);
        if (item.trackedStatus !== MediaDownloadQueueItemTrackedStatus.ok) {
          message += Constants.bot.responses.queue.warning;
        } else {
          message += Constants.bot.responses.queue.downloading(item.estimatedCompletionTime);
        }
        message += "\n";
      }
      await ctx.reply(message);
    } else {
      await ctx.reply(`No items in download queue`);
    }
    return await next();
  }
}
