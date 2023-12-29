import phoneNumberModel from "../model/phoneNumbers.js";
import reportingModel from "../model/reporting.js";
import messenger from "./services/messenger.js";
import logger from "./services/logger.js";
import parsePhoneNumberFromString from "libphonenumber-js";
import responses from "../responses.js";
import entityModel from "../model/entities.js";

const logic = {
  decipherMessage: async (reqBody) => {
    try {
      let { Body: message, From: phone, To: entityPhone } = reqBody;
      const entity = await entityModel.findByPhoneNumber(entityPhone);
      const entityId = entity.entityId;
      const campaignCodes = await entityModel.getCampaignCodes(entityId);
      message = message.toUpperCase().trim();
      const phoneNumber = await phoneNumberModel.findByPhoneNumber({
        entityId,
        phoneNumber: phone,
      });

      // Handle STOP and START
      switch (message) {
        case "STOP":
          await logic.endSubscription(entityId, phone);
          return;
        case "UNSTOP":
        case "START":
          await logic.startSubscription(entityId, phone);
          return;
      }

      // Handle valid campaign code
      if (campaignCodes.includes(message)) {
        const subExists = await phoneNumberModel.findByPhoneNumber({entityId, phoneNumber: phone});
        // If they are already signed up for this code just send a confirmed message
        if (subExists && subExists.campaignCode == message) {
          return responses.VALID_CAMPAIGN_CODE;
        }
        await phoneNumberModel.createOrUpdate({
          entityId,
          phoneNumber: phone,
          campaignCode: message,
          isActive: true,
        });
        // If subExists and it wasn't the same code then record a change of subscription
        const fieldName = subExists ? "changeSubscriptionCount" : "startSubscriptionCount";
        await reportingModel.incrementCount({entityId, campaignCode: message, fieldName});
        return responses.VALID_CAMPAIGN_CODE;
      }

      // Handle admin command
      if (phoneNumber && phoneNumber.isAdmin && phoneNumber.isActive) {
        if (message.split(" ").length > 1) {
          const strCmd = message.split(" ");
          if (strCmd[0] === "SEND" && campaignCodes.includes(strCmd[1])) {
            // Valid campaign code from admin, send out messages
            const count = await logic.handleDeliveryMessage(entityPhone, entityId, strCmd[1]);
            return responses.SEND_CODE.replace("%CODE%", strCmd[1]).replace("%COUNT%", count);
          } else if (strCmd[0] === "ADD") {
            // Add admin
            if (strCmd[1] === "ADMIN" && strCmd[2]) {
              // send the rest of strCmd to addAdmin
              const newAdmin = strCmd.join("").replace("ADDADMIN", "");
              const response = await logic.addAdmin(entityId, newAdmin);
              return response;
            } else if (
              strCmd[1] === "CODE" &&
              strCmd[2] &&
              strCmd[2] !== "STOP"
            ) {
              // Disallow STOP as a campaignCode
              // add campaign code
              await logic.addCampaignCode(entityId, strCmd[2]);
              return responses.ADD_CODE.replace("%CODE%", strCmd[2]);
            }
          } else if (strCmd[0] === "REMOVE") {
            // remove admin
            if (strCmd[1] === "ADMIN" && strCmd[2]) {
              // send the rest of strCmd to removeAdmin
              const admin = strCmd.join("").replace("REMOVEADMIN", "");
              const response = await logic.removeAdmin(entityId, admin);
              return response;
            } else if (strCmd[1] === "CODE" && strCmd[2]) {
              // remove campaign code
              await logic.removeCampaignCode(entityId, strCmd[2]);
              return responses.REMOVE_CODE.replace("%CODE%", strCmd[2]);
            }
          } else if (
            strCmd[0] === "CHANGE" &&
            strCmd[1] === "CODE" &&
            strCmd[2] &&
            strCmd[3] &&
            strCmd[3] !== "STOP"
          ) {
            // Disallow STOP as a campaignCode
            // change code and all subscribers
            await logic.changeCampaignCode(entityId, strCmd[2], strCmd[3]);
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
            const count = await logic.sendCustomMessage(entityPhone, entityId, strCmd[1], reqBody.Body);
            return responses.CUSTOM_MESSAGE.replace("%COUNT%", count);
          } else if (
            strCmd[0] === "SET" &&
            strCmd[1] === "MESSAGE" &&
            strCmd[2]
          ) {
            await logic.setDefaultMessage(entityId, reqBody.Body);
            return responses.SET_MESSAGE;
          }
        } else if (message === "STATUS") {
          // Status check
          return responses.STATUS;
        } else if (message === "SHUTDOWN") {
          // Shut down process
          setTimeout(logic.shutDownProcess, 1000);
          return responses.SHUTDOWN;
        }
      }

      // Default to this if nothing else was hit
      return responses.UNKNOWN;
    } catch (e) {
      logger.error(e.message);
      return responses.ERROR;
    }
  },
  startSubscription: async (entityId, phoneNumber) => {
    await phoneNumberModel.createOrUpdate({
      entityId,
      phoneNumber,
      isActive: true,
    });
    const sub = await phoneNumberModel.findByPhoneNumber({entityId, phoneNumber});
    await reportingModel.incrementCount({entityId, campaignCode: sub.campaignCode, fieldName: "startSubscriptionCount"});
  },
  endSubscription: async (entityId, phoneNumber) => {
    const sub = await phoneNumberModel.findByPhoneNumber({entityId, phoneNumber});
    await phoneNumberModel.createOrUpdate({
      entityId,
      phoneNumber,
      isActive: false,
    });
    await reportingModel.incrementCount({entityId, campaignCode: sub.campaignCode, fieldName: "endSubscriptionCount"});
  },
  handleDeliveryMessage: async (entityPhone, entityId, campaignCode) => {
    const subscribers = await phoneNumberModel.findAllByCode({ entityId, campaignCode });
    let message = await entityModel.getDefaultMessage(entityId);
    if (!message) {
      message = responses.DEFAULT_MESSAGE;
    }
    for (let sub of subscribers) {
      const success = await messenger.send(entityPhone, sub.phoneNumber, message);
      await phoneNumberModel.incrementSendCount({entityId, phoneNumber: sub.phoneNumber, success });
      await reportingModel.incrementCount({entityId, campaignCode, fieldName: success ? "sentCount" : "failedCount"});
    }
    return subscribers.length;
  },
  sendCustomMessage: async (entityPhone, entityId, campaignCode, unparsedMessage) => {
    const subscribers = await phoneNumberModel.findAllByCode({entityId, campaignCode });
    // Remove first two commands from message
    const message = unparsedMessage.split(" ").splice(2).join(" ");
    for (let sub of subscribers) {
      const success = await messenger.send(entityPhone, sub.phoneNumber, message);
      await phoneNumberModel.incrementSendCount({entityId, phoneNumber: sub.phoneNumber, success });
      await reportingModel.incrementCount({entityId, campaignCode, fieldName: success ? "sentCount" : "failedCount"});
    }
    return subscribers.length;
  },
  setDefaultMessage: async (entityId, unparsedMessage) => {
    // Remove first two commands from message
    const message = unparsedMessage.split(" ").splice(2).join(" ");
    await entityModel.setDefaultMessage(entityId, message);
  },
  addAdmin: async (entityId, newAdmin) => {
    let phone;
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
    await phoneNumberModel.createOrUpdate({
      entityId,
      phoneNumber: phone,
      isAdmin: true,
      isActive: true,
    });
    return responses.ADD_ADMIN.replace("%PHONE%", newAdmin);
  },
  addCampaignCode: async (entityId, code) => {
    await entityModel.addCampaignCode(entityId, code);
  },
  removeAdmin: async (entityId, admin) => {
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
    await phoneNumberModel.createOrUpdate({
      entityId,
      phoneNumber: phone,
      isAdmin: false,
    });
    return responses.REMOVE_ADMIN.replace("%PHONE%", admin);
  },
  removeCampaignCode: async (entityId, code) => {
    await entityModel.removeCampaignCode(entityId, code);
    // Update all subscribers with old code to no code
    await phoneNumberModel.updateCampaignCode(entityId, code, null);
  },
  changeCampaignCode: async (entityId, oldCode, newCode) => {
    // Update code
    await entityModel.updateCampaignCode(entityId, oldCode, newCode);
    // Update all subscribers with old code
    await phoneNumberModel.updateCampaignCode(entityId, oldCode, newCode);
  },
  shutDownProcess: async () => {
    process.exit();
  },
};

export default logic;
