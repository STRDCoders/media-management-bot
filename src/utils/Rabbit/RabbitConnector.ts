import { ConfirmChannel, Connection } from "amqplib";
import * as amqplib from "amqplib";
import { LoggerFactory } from "../logger-factory";
import { Logger } from "winston";
import { Constants } from "../constants";

export class RabbitConnector {
  private static INSTANCE: RabbitConnector;
  private connector: Connection;
  private log: Logger = LoggerFactory.getLogger(RabbitConnector.name);

  public static get instance(): RabbitConnector {
    if (!this.INSTANCE) {
      this.INSTANCE = new RabbitConnector();
    }
    return this.instance;
  }

  private async getConnection(): Promise<Connection> {
    if (!this.connector) {
      try {
        this.connector = await amqplib.connect(Constants.Rabbit.uri);
      } catch (error) {
        this.log.error(`Connection failed due to error`, error);
        process.exit(1);
      }
    }

    return this.connector;
  }

  public async closeConnection(): Promise<void> {
    if (this.connector) {
      await this.connector.close();
    }
  }
}
