import stateModel from "../model/state.js";
import phoneNumberModel from "../model/phoneNumbers.js";
import messenger from "./services/messenger.js";
import config from "../config.js";
import logger from "./services/logger.js";
import parsePhoneNumberFromString from "libphonenumber-js";

const logic = {
  decipherMessage: async (reqBody) => {
    try {
      const campaignCodes = await stateModel.getCampaignCodes();
      let { Body: message, From: phone } = reqBody;
      message = message.toUpperCase().trim();
      const phoneNumber = await phoneNumberModel.findByPhoneNumber({
        phoneNumber: phone,
      });

      // Handle STOP and START
      switch (message) {
        case "STOP":
          await phoneNumberModel.createOrUpdate({
            phoneNumber: phone,
            isActive: false
          });
          return;
        case "UNSTOP":
        case "START":
          await phoneNumberModel.createOrUpdate({
            phoneNumber: phone,
            isActive: true
          });
          return;
      }

      // Handle valid campaign code
      if (campaignCodes.includes(message)) {
        await phoneNumberModel.createOrUpdate({
          phoneNumber: phone,
          campaignCode: message,
          isActive: true
        });
        return "You have been signed up to receive notifications. If at any point you want to stop receiving messages, text STOP";
      }

      // Handle admin command
      if (phoneNumber && phoneNumber.isAdmin && phoneNumber.isActive) {
        if (message.split(" ").length > 1) {
          const strCmd = message.split(" ");
          if (strCmd[0] === "SEND" && campaignCodes.includes(strCmd[1])) {
            // Valid campaign code from admin, send out messages
            await logic.handleDeliveryMessage(strCmd[1]);
            return `Messages are now sending for '${strCmd[1]}'`;
          } else if (strCmd[0] === "ADD") {
            // Add admin
            if (strCmd[1] === "ADMIN") {
              // send the rest of strCmd to addAdmin
              const newAdmin = strCmd.join("").replace("ADDADMIN", "");
              const response = await logic.addAdmin(newAdmin);
              return response;
            } else if (strCmd[1] === "CODE" && strCmd[2] !== "STOP") {
              // Disallow STOP as a campaignCode
              // add campaign code
              await logic.addCampaignCode(strCmd[2]);
              return `Successfully added code ${strCmd[2]}`;
            }
          } else if (strCmd[0] === "REMOVE") {
            // remove admin
            if (strCmd[1] === "ADMIN") {
              // send the rest of strCmd to removeAdmin
              const admin = strCmd.join("").replace("REMOVEADMIN", "");
              const response = await logic.removeAdmin(admin);
              return response;
            } else if (strCmd[1] === "CODE") {
              // remove campaign code
              await logic.removeCampaignCode(strCmd[2]);
              return `Successfully removed code ${strCmd[2]}`;
            }
          } else if (strCmd[0] === "CHANGE" && strCmd[1] === "CODE" && strCmd[3] !== 'STOP') {
            // Disallow STOP as a campaignCode
            // change code and all subscribers
            await logic.changeCampaignCode(strCmd[2], strCmd[3]);
            return `Successfully changed code ${strCmd[2]} to ${strCmd[3]}`;
          } else if (strCmd[0] === "CUSTOM") {
            // send custom message - sending original body to preserve original case.
            await logic.sendCustomMessage(strCmd[1], reqBody.Body);
            return "Custom message is now sending";
          } else if (strCmd[0] === "SET" && strCmd[1] === "MESSAGE") {
            await logic.setDefaultMessage(reqBody.Body);
            return "Default message has been set";
          }
        } else if (message === "STATUS") {
          // Status check
          return "RUNNING";
        } else if (message === "SHUTDOWN") {
          // Shut down process
          setTimeout(logic.shutDownProcess, 1000);
          return "Shutting down...";
        }
      }

      // Default to this if nothing else was hit
      return `We don't recognize that code. If you believe it to be correct please send a message to ${config.supportNumberHumanReadable} explaining the problem.`;
    } catch (e) {
      logger.error(e.message);
      return `Something went wrong with that request. Contact ${config.supportNumberHumanReadable} for assistance`;
    }
  },
  handleDeliveryMessage: async (campaignCode) => {
    const subscribers = await phoneNumberModel.findAllByCode({ campaignCode });
    let message = await stateModel.getSetting("deliveryMessage");
    if (!message) {
      message =
        "Your milk has been delivered. Pick up at your earliest convenience during location hours.";
    }
    for (let sub of subscribers) {
      messenger.send(sub.phoneNumber, message);
    }
  },
  sendCustomMessage: async (campaignCode, unparsedMessage) => {
    const subscribers = await phoneNumberModel.findAllByCode({ campaignCode });
    // Remove first two commands from message
    const message = unparsedMessage.split(" ").splice(2).join(" ");
    for (let sub of subscribers) {
      messenger.send(sub.phoneNumber, message);
    }
  },
  setDefaultMessage: async (unparsedMessage) => {
    // Remove first two commands from message
    const message = unparsedMessage.split(" ").splice(2).join(" ");
    const existing = await stateModel.getSetting("deliveryMessage");
    if (typeof existing === "string") {
      // Could still be '' which is falsy so check for string type
      await stateModel.updateSetting("deliveryMessage", message);
    } else {
      await stateModel.createSetting("deliveryMessage", message);
    }
  },
  addAdmin: async (newAdmin) => {
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
      return `Failed to parse '${newAdmin}' as a phone number.`;
    }
    await phoneNumberModel.createOrUpdate({
      phoneNumber: phone,
      isAdmin: true,
    });
    return `Added '${newAdmin}' as an admin.`;
  },
  addCampaignCode: async (code) => {
    await stateModel.addCampaignCode(code);
  },
  removeAdmin: async (admin) => {
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
      return `Failed to parse '${admin}' as a phone number.`;
    }
    await phoneNumberModel.createOrUpdate({
      phoneNumber: phone,
      isAdmin: false,
    });
    return `Removed '${admin}' as an admin.`;
  },
  removeCampaignCode: async (code) => {
    await stateModel.removeCampaignCode(code);
    // Update all subscribers with old code to no code
    await phoneNumberModel.updateCampaignCode(code, null);
  },
  changeCampaignCode: async (oldCode, newCode) => {
    // Update code
    await stateModel.updateCampaignCode(oldCode, newCode);
    // Update all subscribers with old code
    await phoneNumberModel.updateCampaignCode(oldCode, newCode);
  },
  shutDownProcess: async () => {
    process.exit();
  },
};

export default logic;
