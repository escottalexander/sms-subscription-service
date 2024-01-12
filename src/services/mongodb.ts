import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
dotenv.config();

const { mongo_uri, mongo_database_name } = process.env;

const isTest = process.env.NODE_ENV === "test";
const databaseName = isTest ? "sss-test" : mongo_database_name;
const url = `${mongo_uri}/${databaseName}`;
const client = new MongoClient(url, {});

async function connect() {
  const conn: MongoClient = await client.connect();
  const db = conn.db(databaseName);
  return db;
}

export default connect;
