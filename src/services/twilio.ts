import { Twilio } from "twilio/lib";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + "/.env" });
const { twilio_account_sid, twilio_auth_token  } = process.env;

const isTest = process.env.NODE_ENV === "test";
const accountSid = isTest ? "" : twilio_account_sid;
const authToken = isTest ? "" : twilio_auth_token;
const client = isTest ? null : new Twilio(accountSid, authToken);
export default client;
