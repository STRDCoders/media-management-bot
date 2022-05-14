import chai = require("chai");
import chaiAsPromised = require("chai-as-promised");
import * as Sinon from "sinon";
import { SinonSandbox, SinonStub } from "sinon";
import Axios from "axios";
import * as https from "https";
import { RadarrMediaService } from "../../src/services/radarr-media-service";
import { TestUtils } from "../utils/test-utils";
import {
  MediaDownloadQueueItem,
  MediaDownloadQueueItemClientStatus,
  MediaDownloadQueueItemTrackedStatus,
} from "../../src/services/media-service";

chai.use(chaiAsPromised);
chai.use(require("sinon-chai"));

const expect = chai.expect;

describe("Radarr media service", () => {
  let sandbox: SinonSandbox;
  let mockHttpClient;
  let mockHttpClientGetStub: SinonStub;
  let radarrMediaService: RadarrMediaService;

  beforeEach(() => {
    sandbox = Sinon.createSandbox();
    mockHttpClient = Axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    sandbox.stub(Axios, "create").returns(mockHttpClient);
    mockHttpClientGetStub = sandbox.stub(mockHttpClient, "get");
    radarrMediaService = new RadarrMediaService();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("getDownloadQueue", () => {
    const useCaseTestData: Array<UseCaseTest> = Object.values(MediaDownloadQueueItemTrackedStatus)
      .map((trackedStatus: MediaDownloadQueueItemTrackedStatus) =>
        Object.values(MediaDownloadQueueItemClientStatus)
          .filter(
            (clientStatus: MediaDownloadQueueItemClientStatus) =>
              clientStatus !== MediaDownloadQueueItemClientStatus.delay
          )
          .map((clientStatus: MediaDownloadQueueItemClientStatus) => <UseCaseTest>{ trackedStatus, clientStatus })
      )
      .reduce((a, b) => a.concat(b));

    useCaseTestData.forEach((useCase) => {
      it(`should call the http client with the correct url & parse the data correctly when status is ${useCase.clientStatus}_${useCase.trackedStatus}`, async () => {
        const expectedUrl = "queue?pageSize=100";
        const response = TestUtils.readResourceFile("radarr/queue/delay_status_test");
        response.records[0].status = useCase.clientStatus;
        response.records[0].trackedDownloadStatus = useCase.trackedStatus;
        mockHttpClientGetStub.returns(Promise.resolve({ data: response }));

        const queueActual = await radarrMediaService.getDownloadQueue();
        const expectedDTO: MediaDownloadQueueItem = {
          name: response.records[0].title,
          trackedStatus: useCase.trackedStatus,
          clientStatus: useCase.clientStatus,
          estimatedCompletionTime: response.records[0].timeleft,
        };
        expect(mockHttpClientGetStub).to.have.been.calledOnceWithExactly(expectedUrl);
        expect(queueActual).to.deep.equal([expectedDTO]);
      });
    });

    it("should call the http client with the correct url & parse the data correctly when status is delay", async () => {
      const expectedUrl = "queue?pageSize=100";
      const response = TestUtils.readResourceFile("radarr/queue/delay_status_test");
      mockHttpClientGetStub.returns(Promise.resolve({ data: response }));

      const queueActual = await radarrMediaService.getDownloadQueue();
      const expectedDTO: MediaDownloadQueueItem = {
        name: response.records[0].title,
        trackedStatus: undefined,
        clientStatus: MediaDownloadQueueItemClientStatus.delay,
        estimatedCompletionTime: response.records[0].timeleft,
      };
      expect(mockHttpClientGetStub).to.have.been.calledOnceWithExactly(expectedUrl);
      expect(queueActual).to.deep.equal([expectedDTO]);
    });

    interface UseCaseTest {
      trackedStatus: MediaDownloadQueueItemTrackedStatus;
      clientStatus: MediaDownloadQueueItemClientStatus;
    }
  });
});
