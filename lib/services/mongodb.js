import { MongoClient } from "mongodb";
import config from "../../config.js";
import logger from "./logger.js";

const url = `${config.mongo.uri}/${config.mongo.databaseName}`;
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let conn;
try {
  conn = await client.connect();
} catch (e) {
  logger.error(JSON.stringify(e.message));
}

let db = conn.db(config.mongo.databaseName);

export default db;
