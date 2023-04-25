import client from "./twilio.js";
import config from "../../config.js";
import logger from "./logger.js";
const isTest = process.env.NODE_ENV === "test";

const messenger = {
  send: async (toNumber, message) => {
    if (isTest) {
      return;
    }
    try {
      await client.messages
        .create({
          body: message,
          from: config.twilio.accountPhoneNumber,
          to: toNumber,
        });
      logger.info(`Sent message to ${toNumber}: "${message}"`);
    } catch (e) {
      logger.error("Failed to send message: " + JSON.stringify(e.message));
    }
  },
};

export default messenger;
