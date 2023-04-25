import { MongoClient } from "mongodb";
import config from "../../config.js";
import logger from "./logger.js";

const isTest = process.env.NODE_ENV === "test";
const databaseName = isTest ? "sss-test" : config.mongo.databaseName;
const url = `${config.mongo.uri}/${databaseName}`;
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

let db = conn.db(databaseName);

export default db;
