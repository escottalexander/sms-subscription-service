import messenger from "../services/messenger.js";
import logger from "../services/logger.js";
import parsePhoneNumberFromString, { E164Number } from "libphonenumber-js";
import responses from "./responses.js";
import { Entity, EntityModel } from "../model/entities.js";
import { StateModel } from "../model/state.js";
import { PhoneNumber, PhoneNumberModel } from "../model/phoneNumbers.js";
import { ReportingModel } from "../model/reporting.js";
import { Db, WithId } from "mongodb";
import { Request, Response } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { twiml } from "twilio/lib";
import { replaceCommonUnicode, messageContainsUnicode, getSegments } from "../utils/index.js";
const { MessagingResponse } = twiml;

class MessageHandler {
  models: {
    entity: EntityModel,
    phoneNumber: PhoneNumberModel,
    reporting: ReportingModel,
    state: StateModel,
  };
  constructor(storage: Db) {
    this.models = {
      entity: new EntityModel(storage),
      phoneNumber: new PhoneNumberModel(storage),
      reporting: new ReportingModel(storage),
      state: new StateModel(storage),
    }
  }
  async handle(req: Request<{}, any, any, ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>, number>) {
    logger.info("Request received on /webhook: " + JSON.stringify(req.body));
    const requestContext = await this.getRequestContext(req.body);
    const response = await this.decipherMessage(requestContext, req.body);
    if (response) {
      const twimlRes = new MessagingResponse();
      twimlRes.message(response);
      res.type("text/xml");
      res.send(twimlRes.toString());
      try {
        const entityId = requestContext.entity.entityId;
        this.models.reporting.incrementCount({ entityId, fieldName: 'responseCount' });
      } catch (err) {
        logger.error("Failed to increment response count", err.message);
      }
    } else {
      res.sendStatus(200);
    }
  };

  async getRequestContext(reqBody: { Body: string; From: string; To: string; }) {
    const { Body: message, From: fromPhone, To: entityPhone } = reqBody;
    const entity = await this.models.entity.findByPhoneNumber(entityPhone);
    const entityId = entity.entityId;
    const fromPhoneNumberEntry = await this.models.phoneNumber.findByPhoneNumber({
      entityId,
      phoneNumber: fromPhone,
    });
    return {
      message,
      entity,
      fromPhone,
      fromPhoneNumberEntry,
    };
  };

  async decipherMessage(requestContext: { message: string; entity: WithId<Entity>; fromPhone?: string; fromPhoneNumberEntry?: WithId<PhoneNumber>; }, reqBody: { Body: string; From?: string; To?: string; }) {
    try {
      let { message, fromPhone, fromPhoneNumberEntry, entity } = requestContext;
      const { entityId, accountPhoneNumber: entityPhone, campaignCodes = [] } = entity;
      message = message.toUpperCase().trim();

      // Handle STOP and START
      switch (message) {
        case "STOP":
        case "UNSUBSCRIBE":
        case "CANCEL":
          await this.endSubscription(entityId, fromPhone);
          return;
        case "UNSTOP":
        case "START":
          await this.startSubscription(entityId, fromPhone);
          return;
      }

      // Handle valid campaign code
      if (campaignCodes.includes(message)) {
        const subExists = fromPhoneNumberEntry;
        // If they are already signed up for this code just send a confirmed message
        if (subExists && subExists.campaignCode == message) {
          return responses.VALID_CAMPAIGN_CODE;
        }
        await this.models.phoneNumber.createOrUpdate({
          entityId,
          phoneNumber: fromPhone,
          campaignCode: message,
          isActive: true,
        });
        // If subExists and it wasn't the same code then record a change of subscription
        const fieldName = subExists ? "changeSubscriptionCount" : "startSubscriptionCount";
        await this.models.reporting.incrementCount({ entityId, campaignCode: message, fieldName });
        return responses.VALID_CAMPAIGN_CODE;
      }

      // Handle admin command
      if (fromPhoneNumberEntry && fromPhoneNumberEntry.isAdmin && fromPhoneNumberEntry.isActive) {
        if (message.split(" ").length > 1) {
          const strCmd = message.split(" ");
          if (strCmd[0] === "SEND" && campaignCodes.includes(strCmd[1])) {
            // Valid campaign code from admin, send out messages
            const count = await this.handleDeliveryMessage(entityPhone, entityId, strCmd[1]);
            return responses.SEND_CODE.replace("%CODE%", strCmd[1]).replace("%COUNT%", count.toString());
          } if (strCmd[0] === "SEND" && strCmd[1].includes("MESSAGE:") && campaignCodes.includes(strCmd[2])) {
            // Valid campaign code from admin, send out messages
            const messageName = strCmd[1].replace("MESSAGE:", "");
            return await this.sendNamedMessage(entityPhone, entityId, messageName, strCmd[2]);
          } else if (strCmd[0] === "ADD") {
            // Add admin
            if (strCmd[1] === "ADMIN" && strCmd[2]) {
              // send the rest of strCmd to addAdmin
              const newAdmin = strCmd.join("").replace("ADDADMIN", "");
              const response = await this.addAdmin(entityId, newAdmin);
              return response;
            } else if (
              strCmd[1] === "CODE" &&
              strCmd[2] &&
              !["STOP", "CANCEL", "UNSUBSCRIBE"].includes(strCmd[2]) // Disallow STOP keywords as a campaignCode
            ) {
              // add campaign code
              await this.addCampaignCode(entityId, strCmd[2]);
              return responses.ADD_CODE.replace("%CODE%", strCmd[2]);
            }
          } else if (strCmd[0] === "REMOVE") {
            // remove admin
            if (strCmd[1] === "ADMIN" && strCmd[2]) {
              // send the rest of strCmd to removeAdmin
              const admin = strCmd.join("").replace("REMOVEADMIN", "");
              const response = await this.removeAdmin(entityId, admin);
              return response;
            } else if (strCmd[1] === "CODE" && strCmd[2]) {
              // remove campaign code
              await this.removeCampaignCode(entityId, strCmd[2]);
              return responses.REMOVE_CODE.replace("%CODE%", strCmd[2]);
            }
          } else if (
            strCmd[0] === "CHANGE" &&
            strCmd[1] === "CODE" &&
            campaignCodes.includes(strCmd[2]) &&
            strCmd[3] &&
            !["STOP", "CANCEL", "UNSUBSCRIBE"].includes(strCmd[3]) // Disallow STOP keywords as a campaignCode
          ) {
            // change code and all subscribers
            await this.changeCampaignCode(entityId, strCmd[2], strCmd[3]);
            return responses.CHANGE_CODE.replace("%CODE1%", strCmd[2]).replace(
              "%CODE2%",
              strCmd[3]
            );
          } else if (
            strCmd[0] === "CUSTOM" &&
            (campaignCodes.includes(strCmd[1]) || strCmd[1] === "ALL") &&
            strCmd[2]
          ) {
            // send custom message - sending original body to preserve original case.
            const count = await this.sendCustomMessage(entityPhone, entityId, strCmd[1], reqBody.Body);
            return responses.CUSTOM_MESSAGE.replace("%COUNT%", count.toString());
          } else if (
            strCmd[0] === "SET" &&
            strCmd[1] === "MESSAGE" &&
            strCmd[2]
          ) {
            // Get non-uppercased version of message and splice off commands
            const newMessage = replaceCommonUnicode(reqBody.Body.split(" ").splice(2).join(" "));
            const containUnicode = messageContainsUnicode(newMessage);
            await this.setDefaultMessage(entityId, newMessage);
            let segments: number = getSegments(newMessage);
            return `${responses.SET_MESSAGE}.${containUnicode ? " Your message contains unicode characters which restricts segment length to 70 characters." : ""} Segments: ${segments}`;
          } else if (
            strCmd[0] === "SET" &&
            strCmd[1].includes("MESSAGE:") &&
            strCmd[2]
          ) {
            const name = strCmd[1].replace("MESSAGE:", "");
            // Get non-uppercased version of message and splice off commands
            const newMessage = replaceCommonUnicode(reqBody.Body.split(" ").splice(2).join(" "));
            const containUnicode = messageContainsUnicode(newMessage);
            await this.setMessage(entityId, name, newMessage);
            let segments: number = getSegments(newMessage);
            return `${responses.SET_NAMED_MESSAGE.replace("%NAME%", name)}.${containUnicode ? " Your message contains unicode characters which restricts segment length to 70 characters." : ""} Segments: ${segments}`;
          } else if (
            strCmd[0] === "SET" &&
            strCmd[1] === "DEFAULT" &&
            strCmd[2]
          ) {
            const message = await this.setDefaultMessageByName(entityId, strCmd[2]);
            return message;
          } else if (
            strCmd[0] === "GET" &&
            strCmd[1] === "MESSAGE" &&
            strCmd[2] === "NAMES"
          ) {
            const message = await this.getMessageNames(entityId);
            return message;
          } else if (
            strCmd[0] === "GET" &&
            strCmd[1] === "MESSAGE"
          ) {
            const message = await this.getDefaultMessage(entityId);
            return message;
          } else if (
            strCmd[0] === "GET" &&
            strCmd[1].includes("MESSAGE:")
          ) {
            const name = strCmd[1].replace("MESSAGE:", "");
            const message = await this.getMessage(entityId, name);
            return message;
          } else if (
            strCmd[0] === "GET" &&
            strCmd[1] === "LAST" &&
            strCmd[2] === "CODE"
          ) {
            const lastCode = await this.getLastCode(entityId);
            return lastCode;
          }
        } else if (message === "STATUS") {
          // Status check
          return responses.STATUS;
        } else if (message === "SHUTDOWN") {
          // Shut down process
          setTimeout(this.shutDownProcess, 1000);
          return responses.SHUTDOWN;
        }
      }

      // Default to this if nothing else was hit
      return responses.UNKNOWN;
    } catch (e) {
      logger.error(e.message);
      return responses.ERROR;
    }
  };

  async startSubscription(entityId: string, phoneNumber: string) {
    await this.models.phoneNumber.createOrUpdate({
      entityId,
      phoneNumber,
      isActive: true,
    });
    const sub = await this.models.phoneNumber.findByPhoneNumber({ entityId, phoneNumber });
    await this.models.reporting.incrementCount({ entityId, campaignCode: sub.campaignCode, fieldName: "startSubscriptionCount" });
  };

  async endSubscription(entityId: string, phoneNumber: string) {
    const sub = await this.models.phoneNumber.findByPhoneNumber({ entityId, phoneNumber });
    await this.models.phoneNumber.createOrUpdate({
      entityId,
      phoneNumber,
      isActive: false,
    });
    await this.models.reporting.incrementCount({ entityId, campaignCode: sub.campaignCode, fieldName: "endSubscriptionCount" });
  };

  async handleDeliveryMessage(entityPhone: string, entityId: string, campaignCode: string) {
    const subscribers = await this.models.phoneNumber.findAllByCode({ entityId, campaignCode });
    let message = await this.models.entity.getDefaultMessage(entityId);
    if (!message) {
      message = responses.DEFAULT_MESSAGE;
    }
    for (let sub of subscribers) {
      const { success } = await messenger.send(entityPhone, sub.phoneNumber, message);
      const segments: number = getSegments(message);
      await this.models.phoneNumber.incrementSendCount({ entityId, phoneNumber: sub.phoneNumber, success });
      await this.models.reporting.incrementCount({ entityId, campaignCode, fieldName: success ? "sentCount" : "failedCount", segments });
    }
    // Update lastCode
    await this.models.entity.setLastCode(entityId, campaignCode);
    return subscribers.length;
  };

  async sendCustomMessage(entityPhone: string, entityId: string, campaignCode: string, unparsedMessage: string) {
    const subscribers = await this.models.phoneNumber.findAllByCode({ entityId, campaignCode });
    // Remove first two commands from message
    const message = unparsedMessage.split(" ").splice(2).join(" ");
    for (let sub of subscribers) {
      const { success } = await messenger.send(entityPhone, sub.phoneNumber, message);
      const segments: number = getSegments(message);
      await this.models.phoneNumber.incrementSendCount({ entityId, phoneNumber: sub.phoneNumber, success });
      await this.models.reporting.incrementCount({ entityId, campaignCode, fieldName: success ? "sentCount" : "failedCount", segments });
    }
    await this.models.entity.setLastCode(entityId, campaignCode);
    return subscribers.length;
  };

  async sendNamedMessage(entityPhone: string, entityId: string, messageName: string, campaignCode: string) {
    // Valid campaign code from admin, send out messages
    const message = await this.models.entity.getMessage(entityId, messageName);
    if (!message) {
      return responses.UNKNOWN_MSG_NAME;
    }
    const subscribers = await this.models.phoneNumber.findAllByCode({ entityId, campaignCode });

    for (let sub of subscribers) {
      const { success } = await messenger.send(entityPhone, sub.phoneNumber, message);
      const segments: number = getSegments(message);
      await this.models.phoneNumber.incrementSendCount({ entityId, phoneNumber: sub.phoneNumber, success });
      await this.models.reporting.incrementCount({ entityId, campaignCode, fieldName: success ? "sentCount" : "failedCount", segments });
    }
    await this.models.entity.setLastCode(entityId, campaignCode);
    const count = subscribers.length;
    return responses.NAMED_MESSAGE.replace("%COUNT%", count.toString()).replace("%NAME%", messageName);
  };

  async setDefaultMessage(entityId: string, message: string) {
    await this.models.entity.setDefaultMessage(entityId, message);
  };

  async getDefaultMessage(entityId: string) {
    const message = await this.models.entity.getDefaultMessage(entityId);
    return message;
  };

  async setMessage(entityId: string, name: string, message: string) {
    await this.models.entity.setMessage(entityId, name, message);
  };

  async getMessage(entityId: string, name: string) {
    const message = await this.models.entity.getMessage(entityId, name);
    if (!message) {
      return responses.UNKNOWN_MSG_NAME;
    }
    return message;
  };

  async setDefaultMessageByName(entityId: string, name: string) {
    const message = await this.models.entity.getMessage(entityId, name);
    if (!message) {
      return responses.UNKNOWN_MSG_NAME;
    }
    await this.models.entity.setDefaultMessage(entityId, message);
    return responses.SET_MESSAGE;
  }

  async getMessageNames(entityId: string) {
    const names = await this.models.entity.getMessageNames(entityId);
    if (!names || !names.length) {
      return responses.NO_NAMED_MESSAGES;
    }
    const readableNames = names?.join(",\n");
    return readableNames;
  };

  async getLastCode(entityId: string) {
    const lastCode = await this.models.entity.getLastCode(entityId);
    return lastCode;
  }

  async addAdmin(entityId: string, newAdmin: string) {
    let phone: E164Number;
    try {
      phone = parsePhoneNumberFromString(newAdmin, "US").number;
      if (!phone) {
        throw new Error("Failed to parse phone number.");
      }
    } catch (e) {
      logger.error(
        `Could not parse '${newAdmin}' as a phone number: ${JSON.stringify(
          e.message
        )}`
      );
      return responses.FAILED_PARSE_PHONE.replace("%PHONE%", newAdmin);
    }
    await this.models.phoneNumber.createOrUpdate({
      entityId,
      phoneNumber: phone,
      isAdmin: true,
      isActive: true,
    });
    return responses.ADD_ADMIN.replace("%PHONE%", newAdmin);
  };

  async addCampaignCode(entityId: string, code: string) {
    await this.models.entity.addCampaignCode(entityId, code);
  };

  async removeAdmin(entityId: string, admin: string) {
    let phone;
    try {
      phone = parsePhoneNumberFromString(admin, "US").number;
      if (!phone) {
        throw new Error("Failed to parse phone number.");
      }
    } catch (e) {
      logger.error(
        `Could not parse '${admin}' as a phone number: ${JSON.stringify(
          e.message
        )}`
      );
      return responses.FAILED_PARSE_PHONE.replace("%PHONE%", admin);
    }
    await this.models.phoneNumber.createOrUpdate({
      entityId,
      phoneNumber: phone,
      isAdmin: false,
    });
    return responses.REMOVE_ADMIN.replace("%PHONE%", admin);
  };

  async removeCampaignCode(entityId: string, code: string) {
    await this.models.entity.removeCampaignCode(entityId, code);
    // Update all subscribers with old code to no code
    await this.models.phoneNumber.updateCampaignCode(entityId, code, null);
  };

  async changeCampaignCode(entityId: string, oldCode: string, newCode: string) {
    // Update code
    await this.models.entity.updateCampaignCode(entityId, oldCode, newCode);
    // Update all subscribers with old code
    await this.models.phoneNumber.updateCampaignCode(entityId, oldCode, newCode);
  };

  async shutDownProcess() {
    process.exit();
  };
};

export default MessageHandler;
