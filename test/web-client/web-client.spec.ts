import chai = require("chai");
import Axios, { AxiosRequestConfig } from "axios";
import { Constants } from "../../src/utils/constants";
import * as Sinon from "sinon";
import { SinonSandbox } from "sinon";
import { RadarrWebClient } from "../../src/web-client/radarr-web-client";
import { SonarrWebClient } from "../../src/web-client/sonarr-web-client";

chai.use(require("sinon-chai"));
const expect = chai.expect;

describe("Web client", () => {
  describe("Configuration", () => {
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
    describe("Sonarr", () => {
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
          baseURL: `${Constants.sonarr.host}${Constants.sonarr.basePath}`,
          timeout: 3000,
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Content-Type": "application/json",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Accept: "application/json",
          },
          params: {
            apiKey: Constants.sonarr.apiKey,
          },
        };
        new SonarrWebClient();
        expect(Axios.create).to.have.been.calledWith(expectedConf);
      });
    });
  });
});
