import chai = require("chai");
import chaiAsPromised = require("chai-as-promised");
import * as Sinon from "sinon";
import { SinonSandbox, SinonStub } from "sinon";
import Axios from "axios";
import * as https from "https";
import { TestUtils } from "../utils/test-utils";
import {
  MediaDownloadQueueItem,
  MediaDownloadQueueItemClientStatus,
  MediaDownloadQueueItemTrackedStatus,
} from "../../src/services/media-service";
import { SonarrMediaService } from "../../src/services/sonarr-media-service";

chai.use(chaiAsPromised);
chai.use(require("sinon-chai"));

const expect = chai.expect;

describe("Sonarr media service", () => {
  let sandbox: SinonSandbox;
  let mockHttpClient;
  let mockHttpClientGetStub: SinonStub;
  let sonarrMediaService: SonarrMediaService;

  beforeEach(() => {
    sandbox = Sinon.createSandbox();
    mockHttpClient = Axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    sandbox.stub(Axios, "create").returns(mockHttpClient);
    mockHttpClientGetStub = sandbox.stub(mockHttpClient, "get");
    sonarrMediaService = new SonarrMediaService();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("getDownloadQueue", () => {
    const useCaseTestData: Array<UseCaseTest> = Object.values(MediaDownloadQueueItemTrackedStatus)
      .map((trackedStatus: MediaDownloadQueueItemTrackedStatus) =>
        Object.values(MediaDownloadQueueItemClientStatus).map(
          (clientStatus: MediaDownloadQueueItemClientStatus) => <UseCaseTest>{ trackedStatus, clientStatus }
        )
      )
      .reduce((a, b) => a.concat(b));

    useCaseTestData.forEach((useCase) => {
      it(`should call the http client with the correct url & parse the data correctly when status is ${useCase.clientStatus}_${useCase.trackedStatus}`, async () => {
        const expectedQueueUrl = "queue?pageSize=100";
        const queueResponse = TestUtils.readResourceFile("sonarr/queue/status_test");
        queueResponse.records[0].id = Math.floor(Math.random() * 100);
        queueResponse.records[0].episodeId = Math.floor(Math.random() * 100);
        queueResponse.records[0].seriesId = Math.floor(Math.random() * 100);
        queueResponse.records[0].title = "".padEnd(Math.floor(Math.random() * 16) + 3, "a");
        queueResponse.records[0].status = useCase.clientStatus;
        queueResponse.records[0].trackedDownloadStatus = useCase.trackedStatus;
        queueResponse.records = [queueResponse.records[0]];
        mockHttpClientGetStub.withArgs(expectedQueueUrl).resolves({ data: queueResponse });

        const expectedSeriesUrl = "series";
        const seriesResponse = TestUtils.readResourceFile("sonarr/series");
        seriesResponse[0].id = queueResponse.records[0].seriesId;
        seriesResponse[0].title = "".padEnd(Math.floor(Math.random() * 16) + 3, "a");
        mockHttpClientGetStub.withArgs(expectedSeriesUrl).resolves(seriesResponse);

        const expectedEpisodeUrl = `episode?episodeIds=${queueResponse.records[0].episodeId}`;
        const episodeResponse = TestUtils.readResourceFile("sonarr/episode");
        episodeResponse[0].id = queueResponse.records[0].episodeId;
        episodeResponse[0].seriesId = queueResponse.records[0].seriesId;
        episodeResponse[0].seasonNumber = Math.floor(Math.random() * 100);
        episodeResponse[0].episodeNumber = Math.floor(Math.random() * 100);
        mockHttpClientGetStub.withArgs(expectedEpisodeUrl).resolves(episodeResponse);

        const queueActual = await sonarrMediaService.getDownloadQueue();
        const expectedDTO: MediaDownloadQueueItem = {
          name: `${seriesResponse[0].title} - Season: ${episodeResponse[0].seasonNumber} Episode: ${episodeResponse[0].episodeNumber}`,
          trackedStatus: useCase.trackedStatus,
          clientStatus: useCase.clientStatus,
          estimatedCompletionTime: queueResponse.records[0].timeleft,
        };

        expect(mockHttpClientGetStub).to.have.been.calledThrice;
        expect(mockHttpClientGetStub.firstCall).to.have.been.calledWith(expectedSeriesUrl);
        expect(mockHttpClientGetStub.secondCall).to.have.been.calledWith(expectedQueueUrl);
        expect(mockHttpClientGetStub.thirdCall).to.have.been.calledWith(expectedEpisodeUrl);
        expect(queueActual).to.deep.equal([expectedDTO]);
      });
    });

    interface UseCaseTest {
      trackedStatus: MediaDownloadQueueItemTrackedStatus;
      clientStatus: MediaDownloadQueueItemClientStatus;
    }
  });
});
