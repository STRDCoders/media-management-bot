import chai = require("chai");
import Axios, { AxiosRequestConfig } from "axios";
import { Constants } from "../../src/utils/constants";
import * as Sinon from "sinon";
import { SinonSandbox } from "sinon";
import { RadarrWebClient } from "../../src/web-client/radarr-web-client";

chai.use(require("sinon-chai"));
const expect = chai.expect;

describe("Web client", () => {
  describe("Configuration", () => {
    beforeEach(() => {
      process.env.BOT_TOKEN = "bot_token";
      process.env.RADARR_API_KEY = "radarr_api_key";
      process.env.RADARR_HOST = "radarr_host";
      process.env.SONARR_API_KEY = "sonarr_api_key";
      process.env.SONARR_HOST = "sonarr_host";
    });

    describe("Radarr", () => {
      let sandbox: SinonSandbox;

      beforeEach(() => {
        sandbox = Sinon.createSandbox();
        sandbox.spy(Axios, "create");
      });

      afterEach(() => {
        sandbox.restore();
      });

      it("Should create Axios client with correct configuration", () => {
        const expectedConf: AxiosRequestConfig = {
          baseURL: `${Constants.radarr.host}${Constants.radarr.basePath}`,
          timeout: 3000,
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "application/json",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Accept: "application/json",
          },
          params: {
            apiKey: Constants.radarr.apiKey,
          },
        };
        new RadarrWebClient();
        expect(Axios.create).to.have.been.calledWith(expectedConf);
      });
    });
  });
});
