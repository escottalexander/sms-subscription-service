import client from "./twilio.js";
import logger from "./logger.js";
const isTest = process.env.NODE_ENV === "test";

const messenger = {
  send: async (fromNumber, toNumber, message) => {
    if (isTest) {
      return true;
    }
    try {
      const response = await client.messages
        .create({
          body: message,
          from: fromNumber,
          to: toNumber,
        });
      if (response && response.errorCode) {
        logger.error("Received error from Twilio: " + response.errorMessage);
        return false;
      }
      logger.info(`Sent message to ${toNumber}: "${message}" \n Received status '${response.status}'`);
      return true;
    } catch (e) {
      logger.error("Failed to send message: " + JSON.stringify(e.message));
      return false;
    }
  },
};

export default messenger;

// Example response
// {
//   "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//   "api_version": "2010-04-01",
//   "body": "This is the ship that made the Kessel Run in fourteen parsecs?",
//   "date_created": "Thu, 30 Jul 2015 20:12:31 +0000",
//   "date_sent": "Thu, 30 Jul 2015 20:12:33 +0000",
//   "date_updated": "Thu, 30 Jul 2015 20:12:33 +0000",
//   "direction": "outbound-api",
//   "error_code": null,
//   "error_message": null,
//   "from": "+15017122661",
//   "messaging_service_sid": null,
//   "num_media": "0",
//   "num_segments": "1",
//   "price": null,
//   "price_unit": null,
//   "sid": "SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
//   "status": "sent",
//   "subresource_uris": {
//     "media": "/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Messages/SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Media.json"
//   },
//   "to": "+15558675310",
//   "uri": "/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Messages/SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.json"
// }
