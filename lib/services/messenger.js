import client from "./twilio.js";
import config from "../../config.js";
import logger from "./logger.js";

const messenger = {
  send: (toNumber, message) => {
    try {
      client.messages
        .create({
          body: message,
          from: config.twilio.accountPhoneNumber,
          to: toNumber,
        })
        .then((message) => console.log(`Sent message to ${message.to}`));
    } catch (e) {
      logger.error("Failed to send message: " + JSON.stringify(e));
    }
  },
};

export default messenger;
