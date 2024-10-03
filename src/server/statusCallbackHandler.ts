
import logger from "../services/logger.js";
import { PhoneNumberModel } from "../model/phoneNumbers.js";
import { Db } from "mongodb";
import { Request, Response } from "express-serve-static-core";
import { ParsedQs } from "qs";

type StatusCallback = {
  MessageStatus: "sent" | "delivered" | "failed" | "undelivered";
  MessageSid: string;
  MessagingServiceSid: string;
  AccountSid: string;
  From: string;
  ApiVersion: string;
  To: string;
  SmsStatus: string;
  SmsSid: string;
}

class StatusCallbackHandler {
  models: {
    phoneNumber: PhoneNumberModel,
  };
  constructor(storage: Db) {
    this.models = {
      phoneNumber: new PhoneNumberModel(storage),
    }
  }
  async handle(req: Request<{entityId: string}, any, any, ParsedQs, Record<string, any>>) {
    const entityId = req.params.entityId;
    logger.info(`Request received on /status-callback/${entityId}: ` + JSON.stringify(req.body));
    const { MessageStatus: status, To: phoneNumber } = req.body;
    // Update the phoneNumber entry with the status
    if (status === "failed" || status === "undelivered") {
      this.models.phoneNumber.incrementSendCount({ entityId, phoneNumber, success: false });
    }

    if (status === "delivered") {
      this.models.phoneNumber.incrementSendCount({ entityId, phoneNumber, success: true });
    }
  };
};

export default StatusCallbackHandler;
