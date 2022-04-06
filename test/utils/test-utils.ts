import fs from "fs";

export class TestUtils {
  public static readResourceFile = (path: string): any =>
    JSON.parse(fs.readFileSync(`test/resources/${path}.json`, "utf8"));
}
