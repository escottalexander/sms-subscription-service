import config from "../../config.js";
import Twilio from "twilio";
const isTest = process.env.NODE_ENV === "test";
const accountSid = isTest ? "" : config.twilio.accountSid;
const authToken = isTest ? "" : config.twilio.authToken;
const client = isTest ? null : Twilio(accountSid, authToken);
export default client;
