import chai = require("chai");
import chaiAsPromised = require("chai-as-promised");
import * as Sinon from "sinon";
import { SinonSandbox, SinonStub } from "sinon";

import { Bot } from "grammy";
import { BasicContext, Routes, TelegramBotService } from "../../src/services/telegram-bot-service";
import { RadarrMediaService } from "../../src/services/radarr-media-service";
import Axios from "axios";
import { Update } from "@grammyjs/types/update";
import { Constants } from "../../src/utils/constants";
import * as https from "https";
import { UserFromGetMe } from "grammy/out/platform.node";
import { TestUtils } from "../utils/test-utils";
import {
  MediaDownloadQueueItemClientStatus,
  MediaDownloadQueueItemTrackedStatus,
} from "../../src/services/media-service";

chai.use(chaiAsPromised);
chai.use(require("sinon-chai"));

const expect = chai.expect;

let outgoingRequests: any = [];

describe("Bot service", () => {
  let bot: Bot<BasicContext>;
  let radarrMediaService: RadarrMediaService;
  let botService: TelegramBotService;
  let sandbox: SinonSandbox;
  let mockHttpClient;
  let mockHttpClientGetStub: SinonStub;

  const generateMessage = (message: string, uid: number = 11111): Update => ({
    update_id: Math.floor(Math.random() * 1000000),
    message: {
      message_id: Math.floor(Math.random() * 1000000),
      date: Math.floor(new Date().getTime() / 1000),
      text: message,
      chat: {
        id: uid,
        first_name: "Test",
        type: "private",
      },
      from: {
        id: uid,
        first_name: "Test",
        is_bot: false,
      },
    },
  });

  beforeEach(async () => {
    bot = new Bot("token");
    bot.api.config.use((prev, method, payload, signal) => {
      if (!["setMyCommands", "setMyCommands", "deleteWebhook", "getUpdates"].includes(method)) {
        outgoingRequests.push({ method, payload, signal });
      }
      return { ok: true, result: true } as any;
    });

    bot.botInfo = <UserFromGetMe>{
      id: 42,
      first_name: "Test Bot",
      is_bot: true,
      username: "bot",
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
    };

    sandbox = Sinon.createSandbox();
    mockHttpClient = Axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    sandbox.stub(Axios, "create").returns(mockHttpClient);
    mockHttpClientGetStub = sandbox.stub(mockHttpClient, "get");

    radarrMediaService = new RadarrMediaService();
    botService = new TelegramBotService(radarrMediaService, bot);
    outgoingRequests = [];
  });

  afterEach(async () => {
    expect(outgoingRequests).to.be.empty;
    await bot.stop();
    sandbox.restore();
  });

  describe("User validation", () => {
    Object.values(Routes).forEach((route) => {
      it(`should send nothing on '${route}' request if user is not in the allowed users list`, async () => {
        const handleRequestsSpy = sandbox.spy(botService as any, "handleRequests");
        await bot.handleUpdate(generateMessage(route));
        expect(handleRequestsSpy).to.not.have.been.called;
      });
    });
  });

  describe("Validates user", () => {
    const validUserId = 1131;

    beforeEach(() => {
      sandbox.stub(Constants, "allowedUsers").returns([validUserId]);
    });

    describe("/queue", () => {
      it("when no items found, should send the correct message", async () => {
        const message = generateMessage("/queue", validUserId);
        const expectedMessage = "No items in download queue";
        const emptyResponse = TestUtils.readResourceFile("radarr/queue/empty_results");

        mockHttpClientGetStub.resolves({ data: emptyResponse });

        await bot.handleUpdate(message);
        const actualMessage = outgoingRequests.pop();
        expect(actualMessage.method).to.equal("sendMessage");
        expect(actualMessage.payload.chat_id).to.equal(message.message?.chat.id);
        expect(actualMessage.payload.text).to.equal(expectedMessage);
      });

      describe("tracked status is ok", () => {
        Object.values(MediaDownloadQueueItemClientStatus).forEach((clientStatus: MediaDownloadQueueItemClientStatus) =>
          it(`when tracked status is ok and the media status is: ${clientStatus}, should send the correct message`, async () => {
            const message = generateMessage("/queue", validUserId);
            const response = TestUtils.readResourceFile("radarr/queue/status_test");
            const [mediaRecord] = response.records;
            mediaRecord.status = clientStatus;
            mediaRecord.title = "".padEnd(Math.floor(Math.random() * 16) + 3, "a");
            mediaRecord.trackedDownloadStatus = "ok";
            mediaRecord.timeleft =
              Math.floor(Math.random() * 60) +
              ":" +
              Math.floor(Math.random() * 60) +
              ":" +
              Math.floor(Math.random() * 60);

            mockHttpClientGetStub.resolves({ data: response });

            await bot.handleUpdate(message);
            const actualMessage = outgoingRequests.pop();
            expect(actualMessage.method).to.equal("sendMessage");
            expect(actualMessage.payload.chat_id).to.equal(message.message?.chat.id);
            expect(actualMessage.payload.text).to.equal(
              `${mediaRecord.title} - 📥 Downloading(${mediaRecord.timeleft} remaining)`
            );
          })
        );
      });

      Object.values(MediaDownloadQueueItemTrackedStatus)
        .filter((it) => it !== MediaDownloadQueueItemTrackedStatus.ok)
        .forEach((trackedStatus: MediaDownloadQueueItemTrackedStatus) =>
          describe(`tracked status is ${trackedStatus}`, () => {
            Object.values(MediaDownloadQueueItemClientStatus).forEach(
              (clientStatus: MediaDownloadQueueItemClientStatus) =>
                it(`when tracked status ${trackedStatus} and the media status is: ${clientStatus}, should send the correct message`, async () => {
                  const message = generateMessage("/queue", validUserId);
                  const response = TestUtils.readResourceFile("radarr/queue/status_test");
                  const [mediaRecord] = response.records;
                  mediaRecord.status = clientStatus;
                  mediaRecord.title = "".padEnd(Math.floor(Math.random() * 16) + 3, "a");
                  mediaRecord.trackedDownloadStatus = trackedStatus;

                  mockHttpClientGetStub.resolves({ data: response });

                  await bot.handleUpdate(message);
                  const actualMessage = outgoingRequests.pop();
                  expect(actualMessage.method).to.equal("sendMessage");
                  expect(actualMessage.payload.chat_id).to.equal(message.message?.chat.id);
                  expect(actualMessage.payload.text).to.equal(`${mediaRecord.title} - ⚠️ Contact admin`);
                })
            );
          })
        );
    });
  });
});
